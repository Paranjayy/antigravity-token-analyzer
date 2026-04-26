import fs from 'fs';
import path from 'path';
import { get_encoding } from 'tiktoken';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';

const ANTIGRAVITY_PATH = '/Users/paranjay/.gemini/antigravity/brain';
const OPENCODE_DB_PATH = '/Users/paranjay/.local/share/opencode/opencode.db';
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
    toolUsage: {},
    timeline: {},
    providers: {
      antigravity: { conversations: 0, tokens: { input: 0, output: 0 }, cost: 0, artifacts: 0, errors: 0 },
      opencode: { conversations: 0, tokens: { input: 0, output: 0 }, cost: 0, artifacts: 0, errors: 0 }
    },
    projects: {}, 
    hourHeatmap: Array(24).fill(0),
    dayHeatmap: Array(7).fill(0),
    topConversations: [],
    recentActivity: [],
    engineering: {
      totalLOC: 0,
      filesAffected: 0,
      toolsPerSession: 0,
      avgResponseTime: 0
    },
    timelineArray: []
  };

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

      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;

      stats.conversations++;
      stats.providers.antigravity.conversations++;
      
      let convInputTokens = 0; // Cumulative string length
      let convProcessedInputTokens = 0; // True API throughput (context aware)
      let convOutputTokens = 0;
      let convCost = 0;
      let convDate = null;
      let convTitle = "Untitled Session";
      let projectCwd = 'General';
      let convErrors = 0;
      let convTools = 0;
      let convInputMessages = 0;
      let convOutputMessages = 0;

      let convModel = DEFAULT_MODEL;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const dateObj = new Date(entry.created_at);
          if (!convDate) {
            convDate = entry.created_at.split('T')[0];
            stats.hourHeatmap[dateObj.getHours()]++;
            stats.dayHeatmap[dateObj.getDay()]++;
            if (entry.content && !entry.content.includes('<USER_SETTINGS_CHANGE>')) {
               convTitle = entry.content.substring(0, 60).replace(/\n/g, ' ') + '...';
            }
          }

          const text = entry.content || '';
          
          // Parse Model Change with higher accuracy
          if (text.includes('Model Selection')) {
            const match = text.match(/setting `Model Selection` from .* to (.*?)\./);
            if (match) {
              const raw = match[1].toLowerCase();
              if (raw.includes('gemini 3.1 pro')) convModel = 'gemini-3.1-pro-preview';
              else if (raw.includes('gemini 3 flash')) convModel = 'gemini-3-flash-preview';
              else if (raw.includes('gemini 3 pro')) convModel = 'gemini-3-pro-preview';
              else if (raw.includes('claude sonnet 4.6')) convModel = 'claude-sonnet-4-6';
              else if (raw.includes('claude sonnet 4.5')) convModel = 'claude-sonnet-4-5';
              else if (raw.includes('claude opus 4.5')) convModel = 'claude-opus-4-5';
              else if (raw.includes('gemini 2.5 pro')) convModel = 'gemini-2.5-pro';
              else if (raw.includes('gemini 2.5 flash')) convModel = 'gemini-2.5-flash';
              else if (raw.includes('deepseek reasoner')) convModel = 'deepseek-reasoner';
              else if (raw.includes('deepseek chat')) convModel = 'deepseek-chat';
              else if (raw.includes('gpt 5')) convModel = 'gpt-5';
              else if (raw.includes('gpt-4o')) convModel = 'gpt-4o';
            }
          }

          const tokens = encoding.encode(text).length;
          const isInput = entry.source === 'USER_EXPLICIT' || entry.type === 'USER_INPUT';
          
          if (isInput) {
            // Estimate context growth: Add current conversation total to input
            const estimatedInput = convInputTokens + convOutputTokens + tokens;
            convInputTokens += tokens;
            convProcessedInputTokens += estimatedInput; // Track the TRUE amount of tokens sent
            convInputMessages++;
            stats.messageCount.input++;
            
            // For pricing, we use the estimated total input (current context)
            let currentModelData = null;
            for (const provider in pricing) {
              if (pricing[provider].models && pricing[provider].models[convModel]) {
                currentModelData = pricing[provider].models[convModel];
                break;
              }
            }
            if (currentModelData) {
              const stepCost = (estimatedInput / 1e6) * (currentModelData.cost.input || 0);
              convCost += stepCost;
              stats.totalCost += stepCost;
              stats.providers.antigravity.cost += stepCost;
              if (convDate) {
                if (!stats.timeline[convDate]) stats.timeline[convDate] = { input: 0, output: 0, cost: 0, tools: 0 };
                stats.timeline[convDate].cost += stepCost;
              }
            }

          } else {
            convOutputTokens += tokens;
            convOutputMessages++;
            stats.messageCount.output++;

            // Output pricing
            let currentModelData = null;
            for (const provider in pricing) {
              if (pricing[provider].models && pricing[provider].models[convModel]) {
                currentModelData = pricing[provider].models[convModel];
                break;
              }
            }
            if (currentModelData) {
              const stepCost = (tokens / 1e6) * (currentModelData.cost.output || 0);
              convCost += stepCost;
              stats.totalCost += stepCost;
              stats.providers.antigravity.cost += stepCost;
              if (convDate) {
                if (!stats.timeline[convDate]) stats.timeline[convDate] = { input: 0, output: 0, cost: 0, tools: 0 };
                stats.timeline[convDate].cost += stepCost;
              }
            }
          }

          if (entry.type === 'TOOL_OUTPUT' && (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed'))) {
            convErrors++;
            stats.providers.antigravity.errors++;
          }

          if (entry.tool_calls) {
            convTools += entry.tool_calls.length;
            entry.tool_calls.forEach(tc => {
              stats.toolUsage[tc.name] = (stats.toolUsage[tc.name] || 0) + 1;
              if (tc.args?.Cwd) projectCwd = tc.args.Cwd.split('/').pop().replace(/"/g, '');
              
              // LOC Tracking
              if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
                stats.engineering.filesAffected++;
                const code = tc.args.CodeContent || tc.args.ReplacementContent || '';
                stats.engineering.totalLOC += code.split('\n').length;
              }
            });
          }
        } catch (e) {}
      }

      const stepsPath = path.join(ANTIGRAVITY_PATH, dir, '.system_generated/steps');
      let artifactCount = 0;
      if (fs.existsSync(stepsPath)) {
        artifactCount = fs.readdirSync(stepsPath).length;
        stats.providers.antigravity.artifacts += artifactCount;
      }

      // Final total token aggregation (pricing is now done per step)
      stats.totalTokens.input += convProcessedInputTokens;
      stats.totalTokens.output += convOutputTokens;
      stats.providers.antigravity.tokens.input += convProcessedInputTokens;
      stats.providers.antigravity.tokens.output += convOutputTokens;
      
      const convSummary = { 
        id: dir, 
        title: convTitle, 
        tokens: convProcessedInputTokens + convOutputTokens, 
        cost: convCost, 
        date: convDate,
        project: projectCwd,
        tools: convTools,
        errors: convErrors,
        artifacts: artifactCount
      };

      stats.topConversations.push(convSummary);
      if (stats.recentActivity.length < 10) stats.recentActivity.push(convSummary);

      if (convDate) {
        if (!stats.timeline[convDate]) stats.timeline[convDate] = { input: 0, output: 0, cost: 0, tools: 0, inputMessages: 0, outputMessages: 0 };
        stats.timeline[convDate].input += convProcessedInputTokens;
        stats.timeline[convDate].output += convOutputTokens;
        stats.timeline[convDate].cost += convCost;
        stats.timeline[convDate].tools += convTools;
        stats.timeline[convDate].inputMessages += convInputMessages;
        stats.timeline[convDate].outputMessages += convOutputMessages;
      }

      if (!stats.projects[projectCwd]) stats.projects[projectCwd] = { tokens: 0, cost: 0, sessions: 0, errors: 0 };
      stats.projects[projectCwd].tokens += (convProcessedInputTokens + convOutputTokens);
      stats.projects[projectCwd].cost += convCost;
      stats.projects[projectCwd].sessions++;
      stats.projects[projectCwd].errors += convErrors;
    }
  }

  // 2. Analyze OpenCode
  if (fs.existsSync(OPENCODE_DB_PATH)) {
    try {
      const db = new Database(OPENCODE_DB_PATH, { readonly: true });
      const messages = db.prepare('SELECT data FROM message').all();
      for (const row of messages) {
        try {
          const data = JSON.parse(row.data);
          const dateObj = new Date(data.time.created);
          const date = dateObj.toISOString().split('T')[0];
          
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

            if (!stats.timeline[date]) stats.timeline[date] = { input: 0, output: 0, cost: 0, tools: 0 };
            stats.timeline[date].input += input;
            stats.timeline[date].output += output;
            stats.timeline[date].cost += cost;
          }
          if (data.role === 'user') stats.messageCount.input++;
          else stats.messageCount.output++;
        } catch (e) {}
      }
      db.close();
    } catch (e) {}
  }

  // 3. Analyze Git Activity (LOC generated)
  stats.gitLoc = { insertions: 0, deletions: 0, commits: 0 };
  for (const projectPath in stats.projects) {
    if (projectPath === 'General') continue;
    try {
      const gitStats = execSync('git log --shortstat --since="30 days ago"', { cwd: projectPath, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      
      const insertionMatches = Array.from(gitStats.matchAll(/(\d+)\s+insertion/g));
      const deletionMatches = Array.from(gitStats.matchAll(/(\d+)\s+deletion/g));
      
      if (insertionMatches.length > 0) {
        stats.gitLoc.insertions += insertionMatches.reduce((acc, match) => acc + parseInt(match[1]), 0);
      }
      if (deletionMatches.length > 0) {
        stats.gitLoc.deletions += deletionMatches.reduce((acc, match) => acc + parseInt(match[1]), 0);
      }
      
      const commitMatches = gitStats.match(/^commit\s+[a-f0-9]{40}/gm);
      if (commitMatches) {
        stats.gitLoc.commits += commitMatches.length;
        stats.projects[projectPath].commits = commitMatches.length;
      }
    } catch (e) {
      // Not a git repo or no commits
    }
  }

  stats.timelineArray = Object.entries(stats.timeline)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  stats.topConversations.sort((a, b) => b.tokens - a.tokens);
  stats.topConversations = stats.topConversations.slice(0, 15);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2));
  console.log('Advanced professional stats generated.');
}

analyze().catch(console.error);
