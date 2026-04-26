import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import Database from 'better-sqlite3';
import { get_encoding } from 'tiktoken';

const ANTIGRAVITY_PATH = '/Users/paranjay/.gemini/antigravity/brain';
const OPENCODE_DB_PATH = '/Users/paranjay/.local/share/opencode/opencode.db';
const CODEX_DB_PATH = '/Users/paranjay/.codex/logs_2.sqlite';
const CODEX_SESSION_INDEX_PATH = '/Users/paranjay/.codex/session_index.jsonl';
const PRICING_PATH = path.join(process.cwd(), 'src/data/pricing.json');
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/stats.json');
const MODELS_DEV_URL = 'https://models.dev/api.json';
const DEFAULT_MODEL = 'gemini-3-pro-preview';

const emptyTimelineBucket = () => ({
  input: 0,
  output: 0,
  cost: 0,
  tools: 0,
  inputMessages: 0,
  outputMessages: 0,
  ag_input: 0,
  ag_output: 0,
  ag_cost: 0,
  oc_input: 0,
  oc_output: 0,
  oc_cost: 0,
  cx_input: 0,
  cx_output: 0,
  cx_cost: 0
});

const ensureTimelineBucket = (stats, date) => {
  if (!stats.timeline[date]) stats.timeline[date] = emptyTimelineBucket();
  return stats.timeline[date];
};

const ensureProjectBucket = (stats, projectName) => {
  if (!stats.projects[projectName]) {
    stats.projects[projectName] = {
      tokens: { input: 0, output: 0 },
      cost: 0,
      sessions: 0,
      tools: 0,
      avgEfficiency: 0,
      inputMessages: 0,
      outputMessages: 0
    };
  }
  return stats.projects[projectName];
};

const ensureModelBucket = (stats, modelId, source) => {
  if (!stats.models[modelId]) {
    stats.models[modelId] = { source, tokens: 0, sessions: 0, cost: 0 };
  }
  return stats.models[modelId];
};

const normalizeProjectName = (cwd) => {
  if (!cwd) return 'General';
  const cleaned = String(cwd)
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '');
  const base = path.basename(cleaned).replace(/["']/g, '');
  return base || 'General';
};

const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractMatch = (text, pattern) => {
  const match = String(text || '').match(pattern);
  return match ? match[1] : null;
};

const getModelId = (payload) => {
  return payload?.modelID || payload?.model?.modelID || payload?.model?.id || payload?.model?.name || null;
};

const getMessageRole = (payload) => {
  return payload?.role || payload?.message?.role || null;
};

const getMessageText = (payload, partsByMessageId, messageId) => {
  const textParts = partsByMessageId.get(messageId) || [];
  if (textParts.length > 0) return textParts.join('\n');
  if (payload?.text) return String(payload.text);
  if (payload?.content) return String(payload.content);
  return '';
};

async function analyze() {
  const encoding = get_encoding('cl100k_base');
  const localPricing = parseJsonSafely(fs.readFileSync(PRICING_PATH, 'utf8')) || {};

  let pricingData = localPricing;
  try {
    const res = await axios.get(MODELS_DEV_URL, { timeout: 10000 });
    pricingData = res.data;
  } catch (error) {
    console.warn(`Using local pricing snapshot because models.dev could not be fetched: ${error.message}`);
  }

  const getModelPricing = (modelId) => {
    if (!modelId) return null;

    if (pricingData[modelId]?.cost) {
      return {
        input: pricingData[modelId].cost?.input || 0,
        output: pricingData[modelId].cost?.output || 0
      };
    }

    for (const provider of Object.values(pricingData)) {
      const models = provider?.models || {};
      if (models[modelId]?.cost) {
        return {
          input: models[modelId].cost?.input || 0,
          output: models[modelId].cost?.output || 0
        };
      }
    }

    return null;
  };

  const stats = {
    totalTokens: { input: 0, output: 0 },
    totalCost: 0,
    conversations: 0,
    messageCount: { input: 0, output: 0 },
    toolUsage: {},
    timeline: {},
    providers: {
    antigravity: {
      conversations: 0,
      sessions: 0,
      tokens: { input: 0, output: 0 },
      cost: 0,
      artifacts: 0,
      errors: 0,
      messages: { input: 0, output: 0 }
    },
    opencode: {
      conversations: 0,
      sessions: 0,
      tokens: { input: 0, output: 0 },
      cost: 0,
      artifacts: 0,
      errors: 0,
      messages: { input: 0, output: 0 }
    },
    codex: {
      conversations: 0,
      sessions: 0,
      tokens: { input: 0, output: 0 },
      cost: 0,
      artifacts: 0,
      errors: 0,
      messages: { input: 0, output: 0 }
    }
  },
    projects: {},
    hourHeatmap: Array(24).fill(0),
    dayHeatmap: Array(7).fill(0),
    topConversations: [],
    recentActivity: [],
    engineering: {
      totalLOC: 0,
      filesAffected: 0,
      modifiedFiles: {},
      toolsPerSession: 0,
      avgResponseTime: 0,
      summaryFiles: 0,
      summaryAdditions: 0,
      summaryDeletions: 0
    },
    models: {},
    timelineArray: []
  };

  const activity = [];

  const registerActivity = (summary) => {
    activity.push(summary);
    stats.topConversations.push(summary);
  };

  const countTool = (name) => {
    if (!name) return;
    stats.toolUsage[name] = (stats.toolUsage[name] || 0) + 1;
  };

  // Antigravity logs
  if (fs.existsSync(ANTIGRAVITY_PATH)) {
    const dirs = fs.readdirSync(ANTIGRAVITY_PATH);
    for (const dir of dirs) {
      const logPath = path.join(ANTIGRAVITY_PATH, dir, '.system_generated/logs/overview.txt');
      if (!fs.existsSync(logPath)) continue;

      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      if (lines.length === 0) continue;

      stats.conversations += 1;
      stats.providers.antigravity.conversations += 1;
      stats.providers.antigravity.sessions += 1;

      let convInputTokens = 0;
      let convOutputTokens = 0;
      let convCost = 0;
      let convDate = null;
      let convTitle = 'Untitled Session';
      let projectCwd = 'General';
      let convErrors = 0;
      let convTools = 0;
      let convInputMessages = 0;
      let convOutputMessages = 0;
      let convModel = DEFAULT_MODEL;
      let convProcessedInputTokens = 0;

      for (const line of lines) {
        const entry = parseJsonSafely(line);
        if (!entry) continue;

        const createdAt = entry.created_at || entry.time?.created || entry.time?.created_at;
        if (createdAt && !convDate) {
          const dateObj = new Date(createdAt);
          if (!Number.isNaN(dateObj.getTime())) {
            convDate = createdAt.split('T')[0];
            stats.hourHeatmap[dateObj.getHours()] += 1;
            stats.dayHeatmap[dateObj.getDay()] += 1;
          }

          if (entry.content && !String(entry.content).includes('<USER_SETTINGS_CHANGE>')) {
            convTitle = String(entry.content).slice(0, 72).replace(/\n/g, ' ') || convTitle;
            if (convTitle.length === 72) convTitle += '...';
          }
        }

        const rawEntry = JSON.stringify(entry).toLowerCase();
        const explicitModel = getModelId(entry);
        if (explicitModel) convModel = explicitModel;
        if (rawEntry.includes('user_settings_change')) {
          if (rawEntry.includes('gemini 3.1 pro') || rawEntry.includes('gemini-3.1-pro')) convModel = 'gemini-3.1-pro';
          else if (rawEntry.includes('gemini 3 pro') || rawEntry.includes('gemini-3-pro')) convModel = 'gemini-3-pro-preview';
          else if (rawEntry.includes('gemini 3 flash') || rawEntry.includes('gemini-3-flash')) convModel = 'gemini-3-flash';
          else if (rawEntry.includes('claude sonnet 4.5')) convModel = 'claude-sonnet-4-5';
          else if (rawEntry.includes('claude opus 4.5')) convModel = 'claude-opus-4-5';
        }

        const text = String(entry.content || '');
        const tokens = encoding.encode(text).length;
        const isInput = entry.source === 'USER_EXPLICIT' || entry.type === 'USER_INPUT' || entry.role === 'user';

        if (isInput) {
          const estimatedInput = convInputTokens + convOutputTokens + tokens;
          convInputTokens += tokens;
          convProcessedInputTokens += estimatedInput;
          convInputMessages += 1;
          stats.messageCount.input += 1;
          stats.providers.antigravity.messages.input += 1;
          stats.totalTokens.input += estimatedInput;
          stats.providers.antigravity.tokens.input += estimatedInput;

          if (convDate) {
            const bucket = ensureTimelineBucket(stats, convDate);
            bucket.input += estimatedInput;
            bucket.inputMessages += 1;
            bucket.ag_input += estimatedInput;
          }

          const currentModelData = getModelPricing(convModel);
          if (currentModelData) {
            const stepCost = (estimatedInput / 1e6) * (currentModelData.input || 0);
            convCost += stepCost;
            stats.totalCost += stepCost;
            stats.providers.antigravity.cost += stepCost;
            if (convDate) {
              const bucket = ensureTimelineBucket(stats, convDate);
              bucket.cost += stepCost;
              bucket.ag_cost += stepCost;
            }
          }
        } else {
          convOutputTokens += tokens;
          convOutputMessages += 1;
          stats.messageCount.output += 1;
          stats.providers.antigravity.messages.output += 1;
          stats.totalTokens.output += tokens;
          stats.providers.antigravity.tokens.output += tokens;

          if (convDate) {
            const bucket = ensureTimelineBucket(stats, convDate);
            bucket.output += tokens;
            bucket.outputMessages += 1;
            bucket.ag_output += tokens;
          }

          const currentModelData = getModelPricing(convModel);
          if (currentModelData) {
            const stepCost = (tokens / 1e6) * (currentModelData.output || 0);
            convCost += stepCost;
            stats.totalCost += stepCost;
            stats.providers.antigravity.cost += stepCost;
            if (convDate) {
              const bucket = ensureTimelineBucket(stats, convDate);
              bucket.cost += stepCost;
              bucket.ag_cost += stepCost;
            }
          }
        }

        if (entry.type === 'TOOL_OUTPUT' || Array.isArray(entry.tool_calls)) {
          if (String(text).toLowerCase().includes('error') || String(text).toLowerCase().includes('failed')) {
            convErrors += 1;
            stats.providers.antigravity.errors += 1;
          }
        }

        if (Array.isArray(entry.tool_calls)) {
          convTools += entry.tool_calls.length;
          for (const toolCall of entry.tool_calls) {
            countTool(toolCall.name);
            if (toolCall.args?.Cwd) projectCwd = normalizeProjectName(toolCall.args.Cwd);

            if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(toolCall.name)) {
              stats.engineering.filesAffected += 1;
              const fPath = toolCall.args?.TargetFile || toolCall.args?.AbsolutePath || 'unknown';
              stats.engineering.modifiedFiles[fPath] = (stats.engineering.modifiedFiles[fPath] || 0) + 1;
              const code = toolCall.args?.CodeContent || toolCall.args?.ReplacementContent || '';
              stats.engineering.totalLOC += code.split('\n').length;
            }
          }
        }
      }

      const stepsPath = path.join(ANTIGRAVITY_PATH, dir, '.system_generated/steps');
      let artifactCount = 0;
      if (fs.existsSync(stepsPath)) {
        artifactCount = fs.readdirSync(stepsPath).length;
        stats.providers.antigravity.artifacts += artifactCount;
      }

      const sessionSummary = {
        id: dir,
        title: convTitle || 'Untitled Session',
        tokens: convProcessedInputTokens + convOutputTokens,
        cost: convCost,
        date: convDate,
        project: projectCwd,
        source: 'antigravity',
        model: convModel,
        tools: convTools,
        errors: convErrors,
        artifacts: artifactCount,
        messages: {
          input: convInputMessages,
          output: convOutputMessages
        }
      };

      registerActivity(sessionSummary);

      if (convDate) {
        const bucket = ensureTimelineBucket(stats, convDate);
        bucket.tools += convTools;
      }

      const projectBucket = ensureProjectBucket(stats, projectCwd);
      projectBucket.tokens.input += convProcessedInputTokens;
      projectBucket.tokens.output += convOutputTokens;
      projectBucket.cost += convCost;
      projectBucket.sessions += 1;
      projectBucket.tools += convTools;
      projectBucket.inputMessages += convInputMessages;
      projectBucket.outputMessages += convOutputMessages;
      projectBucket.avgEfficiency = (projectBucket.tokens.input + projectBucket.tokens.output) / (projectBucket.tools || 1);

      const modelBucket = ensureModelBucket(stats, convModel, 'antigravity');
      modelBucket.tokens += convProcessedInputTokens + convOutputTokens;
      modelBucket.sessions += 1;
      modelBucket.cost += convCost;
    }
  }

  // OpenCode database
  if (fs.existsSync(OPENCODE_DB_PATH)) {
    try {
      const db = new Database(OPENCODE_DB_PATH, { readonly: true, timeout: 5000 });
      const sessions = db.prepare(`
        SELECT
          id,
          title,
          directory,
          slug,
          time_created,
          summary_additions,
          summary_deletions,
          summary_files
        FROM session
        ORDER BY time_created ASC
      `).all();

      const messages = db.prepare(`
        SELECT
          id,
          session_id,
          time_created,
          data
        FROM message
        ORDER BY session_id ASC, time_created ASC
      `).all();

      const parts = db.prepare(`
        SELECT
          message_id,
          data
        FROM part
        ORDER BY session_id ASC, time_created ASC
      `).all();

  const partsByMessageId = new Map();
  const toolCountsByMessageId = new Map();
  for (const row of parts) {
    const parsed = parseJsonSafely(row.data);
    if (!parsed) continue;
    const current = partsByMessageId.get(row.message_id) || [];
    if (parsed.type === 'text' && parsed.text) {
      current.push(parsed.text);
    }
    partsByMessageId.set(row.message_id, current);
    if (parsed.type === 'tool') {
      toolCountsByMessageId.set(row.message_id, (toolCountsByMessageId.get(row.message_id) || 0) + 1);
    }
  }

      const messagesBySession = new Map();
      for (const row of messages) {
        const bucket = messagesBySession.get(row.session_id) || [];
        bucket.push(row);
        messagesBySession.set(row.session_id, bucket);
      }

      for (const session of sessions) {
        const sessionMessages = messagesBySession.get(session.id) || [];
        if (sessionMessages.length === 0) continue;

        stats.conversations += 1;
        stats.providers.opencode.conversations += 1;
        stats.providers.opencode.sessions += 1;

        const projectName = normalizeProjectName(session.directory);
        const projectBucket = ensureProjectBucket(stats, projectName);
        projectBucket.sessions += 1;
        if (Number.isFinite(session.summary_files)) stats.engineering.summaryFiles += Number(session.summary_files || 0);
        if (Number.isFinite(session.summary_additions)) stats.engineering.summaryAdditions += Number(session.summary_additions || 0);
        if (Number.isFinite(session.summary_deletions)) stats.engineering.summaryDeletions += Number(session.summary_deletions || 0);

        let sessionInputTokens = 0;
        let sessionOutputTokens = 0;
        let sessionCost = 0;
        let sessionErrors = 0;
        let sessionTools = 0;
        let sessionInputMessages = 0;
        let sessionOutputMessages = 0;
        let sessionModel = null;
        let firstUserText = '';
        const createdAt = new Date(session.time_created);
        const dateKey = Number.isNaN(createdAt.getTime()) ? null : createdAt.toISOString().split('T')[0];
        let sessionTitle = session.title || session.slug || 'Untitled Session';

        for (const message of sessionMessages) {
          const payload = parseJsonSafely(message.data);
          if (!payload) continue;

          const role = getMessageRole(payload);
          const modelId = getModelId(payload);
          if (modelId && !sessionModel) sessionModel = modelId;

          let inputTokens = 0;
          let outputTokens = 0;
          let messageCost = 0;

          if (role === 'user') {
            sessionInputMessages += 1;
            stats.messageCount.input += 1;
            stats.providers.opencode.messages.input += 1;
            const text = getMessageText(payload, partsByMessageId, message.id);
            if (!firstUserText && text) firstUserText = text;
            inputTokens = encoding.encode(text).length;
            stats.totalTokens.input += inputTokens;
            stats.providers.opencode.tokens.input += inputTokens;
          } else {
            sessionOutputMessages += 1;
            stats.messageCount.output += 1;
            stats.providers.opencode.messages.output += 1;

            const tokens = payload.tokens || {};
            inputTokens = Number(tokens.input || 0);
            outputTokens = Number(tokens.output || 0);

            stats.totalTokens.input += inputTokens;
            stats.totalTokens.output += outputTokens;
            stats.providers.opencode.tokens.input += inputTokens;
            stats.providers.opencode.tokens.output += outputTokens;

            messageCost = Number(payload.cost || 0);
            if (!messageCost && modelId) {
              const pricing = getModelPricing(modelId);
              if (pricing) {
                messageCost = ((inputTokens / 1e6) * (pricing.input || 0)) + ((outputTokens / 1e6) * (pricing.output || 0));
              }
            }
          }

          sessionInputTokens += inputTokens;
          sessionOutputTokens += outputTokens;
          sessionCost += messageCost;
          stats.totalCost += messageCost;
          stats.providers.opencode.cost += messageCost;

          if (payload.error) {
            sessionErrors += 1;
            stats.providers.opencode.errors += 1;
          }

          const timeCreated = payload.time?.created || message.time_created;
          const messageDate = timeCreated ? new Date(timeCreated) : null;
          const bucketDate = messageDate && !Number.isNaN(messageDate.getTime())
            ? messageDate.toISOString().split('T')[0]
            : dateKey;

          if (bucketDate) {
            const bucket = ensureTimelineBucket(stats, bucketDate);
            bucket.input += inputTokens;
            bucket.output += outputTokens;
            bucket.cost += messageCost;
            bucket.oc_input += inputTokens;
            bucket.oc_output += outputTokens;
            bucket.oc_cost += messageCost;
            if (role === 'user') bucket.inputMessages += 1;
            else bucket.outputMessages += 1;
          }

          sessionTools += toolCountsByMessageId.get(message.id) || 0;
        }

        if ((!sessionTitle || sessionTitle === 'Untitled Session') && firstUserText) {
          sessionTitle = firstUserText.slice(0, 72).replace(/\n/g, ' ');
          if (sessionTitle.length === 72) sessionTitle += '...';
        }

        const activitySummary = {
          id: session.id,
          title: sessionTitle,
          tokens: sessionInputTokens + sessionOutputTokens,
          cost: sessionCost,
          date: dateKey,
          project: projectName,
          source: 'opencode',
          model: sessionModel || 'unknown',
          tools: sessionTools,
          errors: sessionErrors,
          artifacts: Number(session.summary_files || 0),
          messages: {
            input: sessionInputMessages,
            output: sessionOutputMessages
          }
        };

        registerActivity(activitySummary);

        if (dateKey) {
          const bucket = ensureTimelineBucket(stats, dateKey);
          bucket.tools += sessionTools;
          bucket.inputMessages += sessionInputMessages;
          bucket.outputMessages += sessionOutputMessages;
        }

        projectBucket.tokens.input += sessionInputTokens;
        projectBucket.tokens.output += sessionOutputTokens;
        projectBucket.cost += sessionCost;
        projectBucket.tools += sessionTools;
        projectBucket.inputMessages += sessionInputMessages;
        projectBucket.outputMessages += sessionOutputMessages;
        projectBucket.avgEfficiency = (projectBucket.tokens.input + projectBucket.tokens.output) / (projectBucket.tools || 1);

        const modelBucket = ensureModelBucket(stats, sessionModel || 'unknown', 'opencode');
        modelBucket.tokens += sessionInputTokens + sessionOutputTokens;
        modelBucket.sessions += 1;
        modelBucket.cost += sessionCost;
      }

      db.close();
    } catch (error) {
      console.warn(`OpenCode analysis skipped: ${error.message}`);
    }
  }

  // Codex logs
  if (fs.existsSync(CODEX_DB_PATH)) {
    try {
      const sessionIndex = new Map();
      if (fs.existsSync(CODEX_SESSION_INDEX_PATH)) {
        const indexLines = fs.readFileSync(CODEX_SESSION_INDEX_PATH, 'utf8').split('\n').filter(Boolean);
        for (const line of indexLines) {
          const parsed = parseJsonSafely(line);
          if (!parsed?.id) continue;
          sessionIndex.set(parsed.id, parsed);
        }
      }

      const db = new Database(CODEX_DB_PATH, { readonly: true, timeout: 5000 });
      const logs = db.prepare(`
        SELECT thread_id, ts, level, target, feedback_log_body
        FROM logs
        WHERE thread_id IS NOT NULL
        ORDER BY thread_id, ts, ts_nanos, id
      `).all();

      const logsByThread = new Map();
      for (const row of logs) {
        const bucket = logsByThread.get(row.thread_id) || [];
        bucket.push(row);
        logsByThread.set(row.thread_id, bucket);
      }

      for (const [threadId, threadLogs] of logsByThread) {
        const meta = sessionIndex.get(threadId) || {};
        stats.conversations += 1;
        stats.providers.codex.conversations += 1;
        stats.providers.codex.sessions += 1;

        let sessionInputTokens = 0;
        let sessionOutputTokens = 0;
        let sessionCost = 0;
        let sessionInputMessages = 0;
        let sessionOutputMessages = 0;
        let sessionErrors = 0;
        let sessionTools = 0;
        let sessionModel = 'gpt-5.4-mini';
        let projectCwd = 'General';
        const seenEventKeys = new Set();

        const startedAt = meta.updated_at ? new Date(meta.updated_at) : new Date((threadLogs[0]?.ts || 0) * 1000);
        const dateKey = Number.isNaN(startedAt.getTime()) ? null : startedAt.toISOString().split('T')[0];
        const sessionTitle = meta.thread_name || `Codex ${threadId.slice(0, 8)}`;

        for (const row of threadLogs) {
          const body = String(row.feedback_log_body || '');
          const promptLength = Number(extractMatch(body, /prompt_length=(\d+)/) || 0);
          const totalUsageTokens = Number(extractMatch(body, /total_usage_tokens=(\d+)/) || 0);
          const estimatedTokens = Number(
            extractMatch(body, /estimated_token_count=Some\((\d+)\)/) ||
            extractMatch(body, /estimated_token_count=(\d+)/) ||
            0
          );
          const turnModelMatch = extractMatch(body, /model=([^\s}\]]+)/);
          const turnCwdMatch = extractMatch(body, /cwd=([^}\s]+)/);

          let eventKey = null;
          if (body.includes('codex.user_prompt')) {
            eventKey = `prompt:${extractMatch(body, /conversation\.id=([^\s]+)/) || threadId}:${promptLength}`;
          } else if (body.includes('post sampling token usage')) {
            eventKey = `usage:${extractMatch(body, /turn_id=([^\s}]+)/) || threadId}:${totalUsageTokens}:${estimatedTokens}`;
          } else if (body.includes('run_sampling_request')) {
            eventKey = `sampling:${extractMatch(body, /turn_id=([^\s}]+)/) || threadId}:${turnModelMatch || ''}:${turnCwdMatch || ''}`;
          }
          if (eventKey && seenEventKeys.has(eventKey)) continue;
          if (eventKey) seenEventKeys.add(eventKey);

          if (body.includes('codex.user_prompt')) {
            countTool('codex_user_prompt');
            sessionInputMessages += 1;
            stats.messageCount.input += 1;
            stats.providers.codex.messages.input += 1;
            sessionTools += body.includes('op.dispatch.user_input') ? 1 : 0;
          }

          if (body.includes('run_sampling_request')) {
            countTool('codex_run_sampling_request');
            sessionTools += 1;
          }

          if (body.includes('post sampling token usage')) {
            countTool('codex_sampling_turn');
            sessionOutputMessages += 1;
            stats.messageCount.output += 1;
            stats.providers.codex.messages.output += 1;

            const outputTokens = Math.max(totalUsageTokens - estimatedTokens, 0);

            sessionInputTokens += estimatedTokens;
            sessionOutputTokens += outputTokens;
            stats.totalTokens.input += estimatedTokens;
            stats.totalTokens.output += outputTokens;
            stats.providers.codex.tokens.input += estimatedTokens;
            stats.providers.codex.tokens.output += outputTokens;

            if (turnModelMatch) sessionModel = turnModelMatch.replace(/[",]/g, '');
            if (turnCwdMatch) projectCwd = normalizeProjectName(turnCwdMatch);

            const pricingInfo = getModelPricing(sessionModel);
            if (pricingInfo) {
              const cost = ((estimatedTokens / 1e6) * (pricingInfo.input || 0)) + ((outputTokens / 1e6) * (pricingInfo.output || 0));
              sessionCost += cost;
              stats.totalCost += cost;
              stats.providers.codex.cost += cost;
              if (dateKey) {
                const bucket = ensureTimelineBucket(stats, dateKey);
                bucket.input += estimatedTokens;
                bucket.output += outputTokens;
                bucket.cost += cost;
                bucket.cx_input += estimatedTokens;
                bucket.cx_output += outputTokens;
                bucket.cx_cost += cost;
              }
            }
          }

          if (turnModelMatch && turnModelMatch !== 'None') sessionModel = turnModelMatch.replace(/[",]/g, '');
          if (turnCwdMatch) projectCwd = normalizeProjectName(turnCwdMatch);
          if (body.includes('shell_snapshot')) countTool('codex_shell_snapshot');

          if (row.level === 'WARN' || row.level === 'ERROR' || /error|failed|disconnect/i.test(body)) {
            sessionErrors += 1;
            stats.providers.codex.errors += 1;
          }
        }

        const projectBucket = ensureProjectBucket(stats, projectCwd);
        projectBucket.sessions += 1;
        projectBucket.tokens.input += sessionInputTokens;
        projectBucket.tokens.output += sessionOutputTokens;
        projectBucket.cost += sessionCost;
        projectBucket.tools += sessionTools;
        projectBucket.inputMessages += sessionInputMessages;
        projectBucket.outputMessages += sessionOutputMessages;
        projectBucket.avgEfficiency = (projectBucket.tokens.input + projectBucket.tokens.output) / (projectBucket.tools || 1);

        const modelBucket = ensureModelBucket(stats, sessionModel, 'codex');
        modelBucket.tokens += sessionInputTokens + sessionOutputTokens;
        modelBucket.sessions += 1;
        modelBucket.cost += sessionCost;

        if (dateKey) {
          const bucket = ensureTimelineBucket(stats, dateKey);
          bucket.tools += sessionTools;
          bucket.inputMessages += sessionInputMessages;
          bucket.outputMessages += sessionOutputMessages;
        }

        const activitySummary = {
          id: threadId,
          title: sessionTitle,
          tokens: sessionInputTokens + sessionOutputTokens,
          cost: sessionCost,
          date: dateKey,
          project: projectCwd,
          source: 'codex',
          model: sessionModel,
          tools: sessionTools,
          errors: sessionErrors,
          artifacts: 0,
          messages: {
            input: sessionInputMessages,
            output: sessionOutputMessages
          }
        };

        registerActivity(activitySummary);
      }

      db.close();
    } catch (error) {
      console.warn(`Codex analysis skipped: ${error.message}`);
    }
  }

  // Git activity and LOC
  stats.gitLoc = { insertions: 0, deletions: 0, commits: 0 };
  for (const projectPath in stats.projects) {
    if (projectPath === 'General') continue;
    try {
      const gitStats = execSync('git log --shortstat --since="30 days ago"', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      });

      const insertionMatches = Array.from(gitStats.matchAll(/(\d+)\s+insertion/g));
      const deletionMatches = Array.from(gitStats.matchAll(/(\d+)\s+deletion/g));

      if (insertionMatches.length > 0) {
        stats.gitLoc.insertions += insertionMatches.reduce((acc, match) => acc + Number(match[1]), 0);
      }
      if (deletionMatches.length > 0) {
        stats.gitLoc.deletions += deletionMatches.reduce((acc, match) => acc + Number(match[1]), 0);
      }

      const commitMatches = gitStats.match(/^commit\s+[a-f0-9]{40}/gm);
      if (commitMatches) {
        stats.gitLoc.commits += commitMatches.length;
        stats.projects[projectPath].commits = commitMatches.length;
      }
    } catch {
      // Not a git repo or no history available.
    }
  }

  stats.timelineArray = Object.entries(stats.timeline)
    .map(([date, data]) => ({ date, ...emptyTimelineBucket(), ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  stats.topConversations = stats.topConversations
    .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
    .slice(0, 15);

  activity.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
  stats.recentActivity = activity.slice(0, 10);

  stats.engineering.toolsPerSession = stats.conversations > 0
    ? Object.values(stats.toolUsage).reduce((sum, count) => sum + count, 0) / stats.conversations
    : 0;
  stats.engineering.avgResponseTime = 0;

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2));
  console.log('Advanced professional stats generated.');
}

analyze().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
