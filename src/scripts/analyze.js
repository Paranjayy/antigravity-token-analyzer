import fs from 'fs';
import path from 'path';
import { get_encoding } from 'tiktoken';
import Database from 'better-sqlite3';

const ANTIGRAVITY_PATH = '/Users/paranjay/.gemini/antigravity/brain';
const OPENCODE_DB_PATH = '/Users/paranjay/.local/share/opencode/opencode.db';
const MEDIA_PATH = '/Users/paranjay/.gemini/antigravity/brain/tempmediaStorage';
const PRICING_PATH = path.join(process.cwd(), 'src/data/pricing.json');
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/stats.json');

const DEFAULT_MODEL = 'gemini-3-pro-preview';

async function analyze() {
  const pricing = JSON.parse(fs.readFileSync(PRICING_PATH, 'utf8'));
  const encoding = get_encoding('cl100k_base');

  const stats = {
    totalTokens: { input: 0, output: 0 },
    totalCost: 0,
    conversations: 0,
    messageCount: { input: 0, output: 0 },
    modelUsage: {},
    toolUsage: {},
    timeline: {},
    providers: {
      antigravity: { conversations: 0, tokens: { input: 0, output: 0 }, cost: 0, artifacts: 0, filesChanged: 0, locAdded: 0, locRemoved: 0 },
      opencode: { conversations: 0, tokens: { input: 0, output: 0 }, cost: 0, artifacts: 0, filesChanged: 0, locAdded: 0, locRemoved: 0 }
    },
    mediaCount: 0,
    projects: {}, // project name -> { tokens, cost, files }
    timelineArray: [],
    recentArtifacts: []
  };

  // Count media
  if (fs.existsSync(MEDIA_PATH)) {
    stats.mediaCount = fs.readdirSync(MEDIA_PATH).length;
  }

  let modelData = null;
  for (const provider in pricing) {
    if (pricing[provider].models && pricing[provider].models[DEFAULT_MODEL]) {
      modelData = pricing[provider].models[DEFAULT_MODEL];
      break;
    }
  }

  // 1. Analyze Antigravity
  if (fs.existsSync(ANTIGRAVITY_PATH)) {
    const dirs = fs.readdirSync(ANTIGRAVITY_PATH);
    for (const dir of dirs) {
      const logPath = path.join(ANTIGRAVITY_PATH, dir, '.system_generated/logs/overview.txt');
      if (!fs.existsSync(logPath)) continue;

      stats.conversations++;
      stats.providers.antigravity.conversations++;
      
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());

      let convInputTokens = 0;
      let convOutputTokens = 0;
      let convDate = null;
      let projectCwd = 'Unknown';

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (!convDate && entry.created_at) convDate = entry.created_at.split('T')[0];
          
          const text = entry.content || '';
          const tokens = encoding.encode(text).length;
          const isInput = entry.source === 'USER_EXPLICIT' || entry.type === 'USER_INPUT';
          
          if (isInput) {
            convInputTokens += tokens;
            stats.messageCount.input++;
          } else {
            convOutputTokens += tokens;
            stats.messageCount.output++;
          }

          if (entry.tool_calls) {
            entry.tool_calls.forEach(tc => {
              const name = tc.name;
              stats.toolUsage[name] = (stats.toolUsage[name] || 0) + 1;
              
              if (tc.args) {
                const args = tc.args;
                convInputTokens += encoding.encode(JSON.stringify(args)).length;
                
                // Track project and LOC
                if (args.Cwd) projectCwd = args.Cwd.split('/').pop();
                
                if (name === 'write_to_file' || name === 'replace_file_content' || name === 'multi_replace_file_content') {
                  stats.providers.antigravity.filesChanged++;
                  
                  if (args.CodeContent) {
                    stats.providers.antigravity.locAdded += args.CodeContent.split('\n').length;
                  }
                  if (args.ReplacementContent) {
                    stats.providers.antigravity.locAdded += args.ReplacementContent.split('\n').length;
                  }
                  if (args.TargetContent) {
                    stats.providers.antigravity.locRemoved += args.TargetContent.split('\n').length;
                  }
                  if (args.ReplacementChunks) {
                    args.ReplacementChunks.forEach(chunk => {
                      if (chunk.ReplacementContent) stats.providers.antigravity.locAdded += chunk.ReplacementContent.split('\n').length;
                      if (chunk.TargetContent) stats.providers.antigravity.locRemoved += chunk.TargetContent.split('\n').length;
                    });
                  }
                }
              }
            });
          }
          if (entry.type === 'TOOL_OUTPUT') convInputTokens += tokens;
        } catch (e) {}
      }

      // Count artifacts for this conv
      const stepsPath = path.join(ANTIGRAVITY_PATH, dir, '.system_generated/steps');
      if (fs.existsSync(stepsPath)) {
        const steps = fs.readdirSync(stepsPath);
        for (const step of steps) {
          if (fs.existsSync(path.join(stepsPath, step, 'content.md'))) {
            stats.providers.antigravity.artifacts++;
          }
        }
      }

      if (modelData) {
        const inputCost = (convInputTokens / 1000000) * modelData.cost.input;
        const outputCost = (convOutputTokens / 1000000) * modelData.cost.output;
        const convCost = inputCost + outputCost;
        
        stats.totalCost += convCost;
        stats.providers.antigravity.cost += convCost;
        stats.providers.antigravity.tokens.input += convInputTokens;
        stats.providers.antigravity.tokens.output += convOutputTokens;
        
        if (convDate) {
          if (!stats.timeline[convDate]) stats.timeline[convDate] = { input: 0, output: 0, cost: 0 };
          stats.timeline[convDate].input += convInputTokens;
          stats.timeline[convDate].output += convOutputTokens;
          stats.timeline[convDate].cost += convCost;
        }

        if (projectCwd) {
          if (!stats.projects[projectCwd]) stats.projects[projectCwd] = { tokens: 0, cost: 0, files: 0 };
          stats.projects[projectCwd].tokens += convInputTokens + convOutputTokens;
          stats.projects[projectCwd].cost += convCost;
          stats.projects[projectCwd].files++;
        }
      }

      stats.totalTokens.input += convInputTokens;
      stats.totalTokens.output += convOutputTokens;
    }
  }

  // 2. Analyze OpenCode
  if (fs.existsSync(OPENCODE_DB_PATH)) {
    try {
      const db = new Database(OPENCODE_DB_PATH, { readonly: true });
      const sessions = db.prepare('SELECT count(*) as count FROM session').get();
      stats.conversations += sessions.count;
      stats.providers.opencode.conversations += sessions.count;

      const messages = db.prepare('SELECT data FROM message').all();
      for (const row of messages) {
        try {
          const data = JSON.parse(row.data);
          const date = new Date(data.time.created).toISOString().split('T')[0];
          
          if (data.tokens) {
            const input = data.tokens.input || 0;
            const output = data.tokens.output || 0;
            const cost = data.cost || 0;

            stats.totalTokens.input += input;
            stats.totalTokens.output += output;
            stats.totalCost += cost;

            stats.providers.opencode.tokens.input += input;
            stats.providers.opencode.tokens.output += output;
            stats.providers.opencode.cost += cost;

            if (!stats.timeline[date]) stats.timeline[date] = { input: 0, output: 0, cost: 0 };
            stats.timeline[date].input += input;
            stats.timeline[date].output += output;
            stats.timeline[date].cost += cost;
          }

          if (data.role === 'user') stats.messageCount.input++;
          if (data.role === 'assistant') stats.messageCount.output++;
          
          if (data.model && data.model.modelID) {
            const m = data.model.modelID;
            stats.modelUsage[m] = (stats.modelUsage[m] || 0) + (data.tokens?.total || 0);
          }
        } catch (e) {}
      }
      db.close();
    } catch (e) {}
  }

  stats.timelineArray = Object.entries(stats.timeline)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2));
  console.log('Analysis complete. Granular stats updated.');
}

analyze().catch(console.error);
