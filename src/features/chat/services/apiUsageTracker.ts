import { STORES, getValue, setValue } from '../../../services/storage/storageManager';

/**
 * Rate limits for different Gemini API plans.
 */
export const GEMINI_RATE_LIMITS = {
  FREE_TIER: {
    requestsPerMinute: 60,
    requestsPerDay: 1500,
    tokensPerMinute: 25000,
    tokensPerDay: 1000000,
  },
  PRO: {
    requestsPerMinute: 120,
    requestsPerDay: 5000,
    tokensPerMinute: 50000,
    tokensPerDay: 2000000,
  },
  ENTERPRISE: {
    requestsPerMinute: 240,
    requestsPerDay: 10000,
    tokensPerMinute: 100000,
    tokensPerDay: 5000000,
  }
};

/**
 * Returns the rate limits for a given plan.
 * @param {'FREE_TIER'|'PRO'|'ENTERPRISE'} plan
 * @returns {object}
 */
export function getRateLimitsForPlan(plan: 'FREE_TIER' | 'PRO' | 'ENTERPRISE') {
  return GEMINI_RATE_LIMITS[plan] || GEMINI_RATE_LIMITS.FREE_TIER;
}
const API_USAGE_KEY = 'gemini-api-usage';
const CONVERSATION_TOKENS_KEY = 'conversation-tokens';

/**
 * Structure of API usage data tracked for the user.
 */
export interface ApiUsageData {
  dailyRequests: number;
  dailyInputTokens: number;
  dailyOutputTokens: number;
  dailyFirstRequest: number;
  
  monthlyRequests: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  monthFirstRequest: number;
  
  lastRequestTime: number;
  lastResponseTime: number;
  
  rateLimitRemaining: number;
  rateLimitReset: number;
  
  errors: ApiErrorRecord[];
  
  plan: 'FREE_TIER' | 'PRO' | 'ENTERPRISE';
}

/**
 * Structure for storing API error records.
 */
export interface ApiErrorRecord {
  timestamp: number;
  statusCode: number;
  message: string;
}

/**
 * Maps conversation IDs to their token usage data.
 */
export interface ConversationTokensMap {
  [conversationId: string]: {
    inputTokens: number;
    outputTokens: number;
    lastUpdated: number;
  }
}

/**
 * Checks if daily usage counters should be reset.
 * @param {ApiUsageData} usage
 * @returns {boolean}
 */
function shouldResetDaily(usage: ApiUsageData): boolean {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return !usage.dailyFirstRequest || (now - usage.dailyFirstRequest) > oneDayMs;
}

/**
 * Checks if monthly usage counters should be reset.
 * @param {ApiUsageData} usage
 * @returns {boolean}
 */
function shouldResetMonthly(usage: ApiUsageData): boolean {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return !usage.monthFirstRequest || (now - usage.monthFirstRequest) > thirtyDaysMs;
}

/**
 * Returns the default structure for API usage data.
 * @returns {ApiUsageData}
 */
function getDefaultApiUsage(): ApiUsageData {
  return {
    dailyRequests: 0,
    dailyInputTokens: 0,
    dailyOutputTokens: 0,
    dailyFirstRequest: 0,
    
    monthlyRequests: 0,
    monthlyInputTokens: 0,
    monthlyOutputTokens: 0,
    monthFirstRequest: 0,
    
    lastRequestTime: 0,
    lastResponseTime: 0,
    
    rateLimitRemaining: GEMINI_RATE_LIMITS.FREE_TIER.requestsPerMinute,
    rateLimitReset: 0,
    
    errors: [],
    
    plan: 'FREE_TIER'
  };
}

export async function loadApiUsage(): Promise<ApiUsageData> {
  try {
    const usage = await getValue<ApiUsageData>(STORES.SETTINGS, API_USAGE_KEY);
    
    if (!usage) {
      return getDefaultApiUsage();
    }
    
    if (shouldResetDaily(usage)) {
      usage.dailyRequests = 0;
      usage.dailyInputTokens = 0;
      usage.dailyOutputTokens = 0;
      usage.dailyFirstRequest = Date.now();
    }
    
    if (shouldResetMonthly(usage)) {
      usage.monthlyRequests = 0;
      usage.monthlyInputTokens = 0;
      usage.monthlyOutputTokens = 0;
      usage.monthFirstRequest = Date.now();
    }
    
    return usage;
  } catch (error) {
    console.error('Failed to load API usage data:', error);
    return getDefaultApiUsage();
  }
}

export async function saveApiUsage(usage: ApiUsageData): Promise<void> {
  try {
    await setValue(STORES.SETTINGS, API_USAGE_KEY, usage);
  } catch (error) {
    console.error('Failed to save API usage data:', error);
  }
}

export async function trackApiRequest(inputTokens: number): Promise<ApiUsageData> {
  const usage = await loadApiUsage();
  
  if (!usage.dailyFirstRequest) {
    usage.dailyFirstRequest = Date.now();
  }
  
  if (!usage.monthFirstRequest) {
    usage.monthFirstRequest = Date.now();
  }
  
  usage.dailyRequests++;
  usage.monthlyRequests++;
  usage.dailyInputTokens += inputTokens;
  usage.monthlyInputTokens += inputTokens;
  usage.lastRequestTime = Date.now();
  
  const limits = getRateLimitsForPlan(usage.plan);
  const minuteMs = 60 * 1000;
  
  if (!usage.rateLimitReset || Date.now() > usage.rateLimitReset) {
    usage.rateLimitRemaining = limits.requestsPerMinute;
    usage.rateLimitReset = Date.now() + minuteMs;
  } else {
    usage.rateLimitRemaining = Math.max(0, usage.rateLimitRemaining - 1);
  }
  
  await saveApiUsage(usage);
  return usage;
}

export async function trackApiResponse(outputTokens: number): Promise<ApiUsageData> {
  const usage = await loadApiUsage();
  
  usage.dailyOutputTokens += outputTokens;
  usage.monthlyOutputTokens += outputTokens;
  usage.lastResponseTime = Date.now();
  usage.dailyOutputTokens += outputTokens;
  usage.monthlyOutputTokens += outputTokens;
  usage.lastResponseTime = Date.now();
  
  await saveApiUsage(usage);
  return usage;
}

export async function trackApiError(statusCode: number, message: string): Promise<ApiUsageData> {
  const usage = await loadApiUsage();
  
  usage.errors.unshift({
    timestamp: Date.now(),
    statusCode,
    message
  });
  
  if (usage.errors.length > 20) {
    usage.errors = usage.errors.slice(0, 20);
  }
  
  await saveApiUsage(usage);
  return usage;
}

export function calculateRemainingUsage(usage: ApiUsageData): {
  dailyRequestsPercent: number;
  dailyTokensPercent: number;
  monthlyRequestsPercent: number;
  monthlyTokensPercent: number;
  rateLimitPercent: number;
} {
  const limits = getRateLimitsForPlan(usage.plan);
  
  return {
    dailyRequestsPercent: 100 - Math.min(100, (usage.dailyRequests / limits.requestsPerDay) * 100),
    dailyTokensPercent: 100 - Math.min(100, ((usage.dailyInputTokens + usage.dailyOutputTokens) / limits.tokensPerDay) * 100),
    monthlyRequestsPercent: 100 - Math.min(100, (usage.monthlyRequests / (limits.requestsPerDay * 30)) * 100),
    monthlyTokensPercent: 100 - Math.min(100, ((usage.monthlyInputTokens + usage.monthlyOutputTokens) / (limits.tokensPerDay * 30)) * 100),
    rateLimitPercent: Math.min(100, (usage.rateLimitRemaining / limits.requestsPerMinute) * 100),
  };
}

export async function loadConversationTokens(): Promise<ConversationTokensMap> {
  try {
    const tokens = await getValue<ConversationTokensMap>(STORES.SETTINGS, CONVERSATION_TOKENS_KEY);
    return tokens || {};
  } catch (error) {
    console.error('Failed to load conversation tokens data:', error);
    return {};
  }
}

export async function saveConversationTokens(tokens: ConversationTokensMap): Promise<void> {
  try {
    await setValue(STORES.SETTINGS, CONVERSATION_TOKENS_KEY, tokens);
  } catch (error) {
    console.error('Failed to save conversation tokens data:', error);
  }
}

export async function updateConversationTokens(
  conversationId: string,
  inputTokens: number,
  outputTokens: number
): Promise<ConversationTokensMap> {
  const allTokens = await loadConversationTokens();
  
  allTokens[conversationId] = allTokens[conversationId] || {
    inputTokens: 0,
    outputTokens: 0,
    lastUpdated: Date.now()
  };
  
  allTokens[conversationId].inputTokens += inputTokens;
  allTokens[conversationId].outputTokens += outputTokens;
  allTokens[conversationId].lastUpdated = Date.now();
  
  await saveConversationTokens(allTokens);
  return allTokens;
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export async function cleanupConversationTokens(
  activeConversationIds: string[]
): Promise<void> {
  const allTokens = await loadConversationTokens();
  let changed = false;
  
  const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
  
  const newTokens: ConversationTokensMap = {};
  
  Object.entries(allTokens).forEach(([id, data]) => {
    if (activeConversationIds.includes(id) || data.lastUpdated > threeMonthsAgo) {
      newTokens[id] = data;
    } else {
      changed = true;
    }
  });
  
  if (changed) {
    await saveConversationTokens(newTokens);
  }
}

export function getTotalConversationTokens(
  conversationId: string,
  tokensMap: ConversationTokensMap
): number {
  const data = tokensMap[conversationId];
  if (!data) return 0;
  return data.inputTokens + data.outputTokens;
}

export function getConversationTokenWarningLevel(
  conversationId: string,
  tokensMap: ConversationTokensMap
): 'none' | 'approaching' | 'critical' {
  const MAX_CONVERSATION_TOKENS = 128000;
  const WARNING_THRESHOLD = 0.7;
  const CRITICAL_THRESHOLD = 0.9;
  
  const totalTokens = getTotalConversationTokens(conversationId, tokensMap);
  const usagePercent = totalTokens / MAX_CONVERSATION_TOKENS;
  
  if (usagePercent >= CRITICAL_THRESHOLD) {
    return 'critical';
  } else if (usagePercent >= WARNING_THRESHOLD) {
    return 'approaching';
  } else {
    return 'none';
  }
}
