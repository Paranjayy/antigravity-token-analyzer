import fs from 'fs';
import path from 'path';
import { get_encoding } from 'tiktoken';
import Database from 'better-sqlite3';

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
    modelUsage: {},
    toolUsage: {},
    timeline: {},
    providers: {
      antigravity: { conversations: 0, tokens: { input: 0, output: 0 }, cost: 0 },
      opencode: { conversations: 0, tokens: { input: 0, output: 0 }, cost: 0 }
    },
    modelLimits: {},
    timelineArray: []
  };

  // Find model data for limits
  let modelData = null;
  for (const provider in pricing) {
    if (pricing[provider].models && pricing[provider].models[DEFAULT_MODEL]) {
      modelData = pricing[provider].models[DEFAULT_MODEL];
      stats.modelLimits[DEFAULT_MODEL] = modelData.limit;
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
              stats.toolUsage[tc.name] = (stats.toolUsage[tc.name] || 0) + 1;
              if (tc.args) convInputTokens += encoding.encode(JSON.stringify(tc.args)).length;
            });
          }
          if (entry.type === 'TOOL_OUTPUT') convInputTokens += tokens;
        } catch (e) {}
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
      }

      stats.totalTokens.input += convInputTokens;
      stats.totalTokens.output += convOutputTokens;
    }
  }

  // 2. Analyze OpenCode
  if (fs.existsSync(OPENCODE_DB_PATH)) {
    try {
      const db = new Database(OPENCODE_DB_PATH, { readonly: true });
      
      // Get all sessions
      const sessions = db.prepare('SELECT count(*) as count FROM session').get();
      stats.conversations += sessions.count;
      stats.providers.opencode.conversations += sessions.count;

      // Get all messages with cost/token data
      const messages = db.prepare('SELECT data FROM message').all();
      
      for (const row of messages) {
        try {
          const data = JSON.parse(row.data);
          const date = new Date(data.time.created).toISOString().split('T')[0];
          
          if (data.tokens) {
            const input = data.tokens.input || 0;
            const output = data.tokens.output || 0;
            const cost = data.cost || 0; // OpenCode stores cost directly?

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
    } catch (e) {
      console.error('Error parsing OpenCode DB:', e);
    }
  }

  stats.timelineArray = Object.entries(stats.timeline)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2));
  console.log('Analysis complete. Comprehensive stats updated.');
}

analyze().catch(console.error);
