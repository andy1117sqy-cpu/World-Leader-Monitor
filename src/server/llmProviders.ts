import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { AvailableProvider, LlmProviderId } from '../types/game.ts';

export const SUPPORTED_PROVIDER_IDS: readonly LlmProviderId[] = [
  'gemini',
  'openai',
  'anthropic',
  'deepseek',
  'custom',
] as const;

const PROVIDER_LABELS: Record<LlmProviderId, string> = {
  gemini: 'Gemini',
  openai: 'ChatGPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  deepseek: 'DeepSeek',
  custom: 'Custom API',
};

const DEFAULT_MODELS: Record<LlmProviderId, string> = {
  gemini: 'gemini-3.1-flash-lite',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  deepseek: 'deepseek-chat',
  custom: '',
};

const PROVIDER_ENV_HINTS: Record<LlmProviderId, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  custom: 'CUSTOM_LLM_BASE_URL and CUSTOM_LLM_MODEL',
};

const REQUEST_TIMEOUT_MS = 45_000;

export type EnvMap = Record<string, string | undefined>;

export class ProviderConfigError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ProviderConfigError';
    this.statusCode = statusCode;
  }
}

export function isValidProviderId(value: unknown): value is LlmProviderId {
  return (
    typeof value === 'string' &&
    (SUPPORTED_PROVIDER_IDS as readonly string[]).includes(value)
  );
}

function isRealSecret(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^MY_[A-Z0-9_]+$/i.test(trimmed)) return false;
  if (/^your[_-]/i.test(trimmed)) return false;
  return true;
}

export function validateCustomBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ProviderConfigError('CUSTOM_LLM_BASE_URL must be a valid http or https URL.', 500);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ProviderConfigError('CUSTOM_LLM_BASE_URL must use http:// or https://.', 500);
  }

  const host = parsed.hostname.toLowerCase();
  // Block cloud instance metadata endpoints
  if (
    host === '169.254.169.254' ||
    host === 'metadata.google.internal' ||
    host === 'metadata' ||
    host.startsWith('169.254.')
  ) {
    throw new ProviderConfigError('CUSTOM_LLM_BASE_URL cannot target cloud metadata endpoints.', 500);
  }

  return trimmed;
}

export function getProviderModel(id: LlmProviderId, env: EnvMap = process.env): string {
  switch (id) {
    case 'gemini':
      return env.GEMINI_MODEL?.trim() || DEFAULT_MODELS.gemini;
    case 'openai':
      return env.OPENAI_MODEL?.trim() || DEFAULT_MODELS.openai;
    case 'anthropic':
      return env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODELS.anthropic;
    case 'deepseek':
      return env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODELS.deepseek;
    case 'custom':
      return env.CUSTOM_LLM_MODEL?.trim() || '';
  }
}

export function isProviderConfigured(id: LlmProviderId, env: EnvMap = process.env): boolean {
  switch (id) {
    case 'gemini':
      return isRealSecret(env.GEMINI_API_KEY);
    case 'openai':
      return isRealSecret(env.OPENAI_API_KEY);
    case 'anthropic':
      return isRealSecret(env.ANTHROPIC_API_KEY);
    case 'deepseek':
      return isRealSecret(env.DEEPSEEK_API_KEY);
    case 'custom': {
      const baseUrl = env.CUSTOM_LLM_BASE_URL?.trim();
      const model = env.CUSTOM_LLM_MODEL?.trim();
      if (!baseUrl || !model || !isRealSecret(baseUrl)) return false;
      try {
        validateCustomBaseUrl(baseUrl);
        return true;
      } catch {
        return false;
      }
    }
  }
}

export function getConfiguredProviders(env: EnvMap = process.env): AvailableProvider[] {
  const result: AvailableProvider[] = [];
  for (const id of SUPPORTED_PROVIDER_IDS) {
    if (!isProviderConfigured(id, env)) continue;
    const customLabel = id === 'custom' && env.CUSTOM_LLM_LABEL?.trim()
      ? env.CUSTOM_LLM_LABEL.trim().slice(0, 40)
      : PROVIDER_LABELS[id];
    result.push({
      id,
      label: customLabel,
      model: getProviderModel(id, env),
    });
  }
  return result;
}

export function getDefaultProviderId(env: EnvMap = process.env): LlmProviderId | null {
  const configured = getConfiguredProviders(env);
  if (configured.length === 0) return null;

  const envPreferred = env.LLM_PROVIDER?.trim().toLowerCase();
  if (isValidProviderId(envPreferred) && configured.some((p) => p.id === envPreferred)) {
    return envPreferred;
  }

  return configured[0].id;
}

export function resolveRequestedProvider(
  requested: unknown,
  env: EnvMap = process.env
): LlmProviderId {
  if (requested === undefined || requested === null || requested === '') {
    const fallback = getDefaultProviderId(env);
    if (!fallback) {
      throw new ProviderConfigError(
        'No AI provider is configured. Set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, or CUSTOM_LLM_BASE_URL + CUSTOM_LLM_MODEL in your server environment.',
        503
      );
    }
    return fallback;
  }

  if (!isValidProviderId(requested)) {
    throw new ProviderConfigError(
      `Unsupported AI provider. Supported providers: ${SUPPORTED_PROVIDER_IDS.join(', ')}.`,
      400
    );
  }

  if (!isProviderConfigured(requested, env)) {
    throw new ProviderConfigError(
      `${PROVIDER_LABELS[requested]} is not configured on the server. Set ${PROVIDER_ENV_HINTS[requested]} in your environment.`,
      400
    );
  }

  return requested;
}

/**
 * Extracts a JSON object string from raw LLM text output.
 * Handles plain JSON, markdown ```json ... ``` blocks, or prose wrapping an object.
 */
export function extractJsonObject(rawText: string): string {
  const trimmed = (rawText ?? '').trim();
  if (!trimmed) {
    throw new Error('Model returned an empty response.');
  }

  // Fast path: already valid JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // Strip fenced markdown code blocks if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    const inner = fenceMatch[1].trim();
    if (inner.startsWith('{') && inner.endsWith('}')) {
      return inner;
    }
  }

  // Fallback: locate the outermost balanced JSON object
  const start = trimmed.indexOf('{');
  if (start === -1) {
    throw new Error('Model response did not contain a JSON object.');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return trimmed.slice(start, i + 1);
      }
    }
  }

  throw new Error('Model response contained an incomplete JSON object.');
}

export function buildOpenAiCompatiblePayload(params: {
  model: string;
  systemInstruction: string;
  userPrompt: string;
  enforceJsonFormat: boolean;
}) {
  const isReasoningModel = /^(o1|o3|o4|deepseek-reasoner)/i.test(params.model);
  const isDeepSeekReasoner = /^deepseek-reasoner/i.test(params.model);

  const body: Record<string, unknown> = {
    model: params.model,
    messages: [
      { role: 'system', content: params.systemInstruction },
      { role: 'user', content: params.userPrompt },
    ],
  };

  if (!isReasoningModel) {
    body.temperature = 0.7;
  }

  if (params.enforceJsonFormat && !isDeepSeekReasoner) {
    body.response_format = { type: 'json_object' };
  }

  return body;
}

export function buildAnthropicPayload(params: {
  model: string;
  systemInstruction: string;
  userPrompt: string;
}) {
  return {
    model: params.model,
    max_tokens: 2048,
    temperature: 0.7,
    system: params.systemInstruction,
    messages: [{ role: 'user', content: params.userPrompt }],
  };
}

let cachedGeminiClient: GoogleGenAI | null = null;
let cachedGeminiKey: string | undefined;

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!cachedGeminiClient || cachedGeminiKey !== apiKey) {
    cachedGeminiKey = apiKey;
    cachedGeminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedGeminiClient;
}

async function withTransientRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('502') ||
        msg.includes('529') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('overloaded');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 450 * attempt));
    }
  }
  throw lastError;
}

function sanitizeUpstreamError(provider: LlmProviderId, status: number, rawBody: string): string {
  const label = PROVIDER_LABELS[provider];
  if (status === 401 || status === 403) {
    return `${label} rejected the configured API key (HTTP ${status}). Verify ${PROVIDER_ENV_HINTS[provider]} on the server.`;
  }
  if (status === 429) {
    return `${label} rate limit or quota exceeded (HTTP 429). Please wait a moment or switch providers.`;
  }
  if (status === 503 || status === 529) {
    return `${label} is temporarily overloaded (HTTP ${status}). Please try again.`;
  }

  // Extract a short, safe error message without echoing headers or secrets
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: { message?: string } | string;
      message?: string;
    };
    const msg =
      typeof parsed.error === 'string'
        ? parsed.error
        : parsed.error?.message || parsed.message;
    if (msg) {
      return `${label} error (HTTP ${status}): ${msg.slice(0, 180)}`;
    }
  } catch {
    // Non-JSON upstream error body
  }

  return `${label} request failed (HTTP ${status}).`;
}

async function callOpenAiCompatibleEndpoint(params: {
  provider: 'openai' | 'deepseek' | 'custom';
  endpointUrl: string;
  apiKey?: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  enforceJsonFormat: boolean;
}): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey}`;
  }

  const payload = buildOpenAiCompatiblePayload({
    model: params.model,
    systemInstruction: params.systemInstruction,
    userPrompt: params.userPrompt,
    enforceJsonFormat: params.enforceJsonFormat,
  });

  const response = await fetch(params.endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(sanitizeUpstreamError(params.provider, response.status, errBody));
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${PROVIDER_LABELS[params.provider]} returned an empty completion.`);
  }
  return content;
}

async function callAnthropicEndpoint(params: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
}): Promise<string> {
  const payload = buildAnthropicPayload({
    model: params.model,
    systemInstruction: params.systemInstruction,
    userPrompt: params.userPrompt,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(sanitizeUpstreamError('anthropic', response.status, errBody));
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const textBlock = data.content?.find((b) => b.type === 'text' && typeof b.text === 'string');
  if (!textBlock?.text?.trim()) {
    throw new Error('Claude (Anthropic) returned an empty completion.');
  }
  return textBlock.text;
}

export async function generateStructuredJson<T>(params: {
  providerId: LlmProviderId;
  systemInstruction: string;
  userPrompt: string;
  geminiSchema: Record<string, unknown>;
  jsonContract: string;
  env?: EnvMap;
}): Promise<{ data: T; provider: LlmProviderId; model: string }> {
  const env = params.env ?? process.env;
  const { providerId } = params;
  const model = getProviderModel(providerId, env);

  const rawText = await withTransientRetry(async () => {
    if (providerId === 'gemini') {
      const apiKey = env.GEMINI_API_KEY?.trim() ?? '';
      const ai = getGeminiClient(apiKey);
      const config: Record<string, unknown> = {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.geminiSchema,
      };
      if (model.startsWith('gemini-3.1-flash-lite') || model.startsWith('gemini-3-flash')) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }
      const response = await ai.models.generateContent({
        model,
        contents: params.userPrompt,
        config,
      });
      return response.text ?? '';
    }

    const fullSystem = `${params.systemInstruction}\n\n${params.jsonContract}\nReturn ONLY a single valid JSON object with no markdown fences or commentary.`;

    if (providerId === 'openai') {
      const apiKey = env.OPENAI_API_KEY?.trim() ?? '';
      return callOpenAiCompatibleEndpoint({
        provider: 'openai',
        endpointUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey,
        model,
        systemInstruction: fullSystem,
        userPrompt: params.userPrompt,
        enforceJsonFormat: true,
      });
    }

    if (providerId === 'deepseek') {
      const apiKey = env.DEEPSEEK_API_KEY?.trim() ?? '';
      return callOpenAiCompatibleEndpoint({
        provider: 'deepseek',
        endpointUrl: 'https://api.deepseek.com/chat/completions',
        apiKey,
        model,
        systemInstruction: fullSystem,
        userPrompt: params.userPrompt,
        enforceJsonFormat: true,
      });
    }

    if (providerId === 'anthropic') {
      const apiKey = env.ANTHROPIC_API_KEY?.trim() ?? '';
      return callAnthropicEndpoint({
        apiKey,
        model,
        systemInstruction: fullSystem,
        userPrompt: params.userPrompt,
      });
    }

    // Custom OpenAI-compatible provider (OpenRouter, Groq, Ollama, Together, Mistral, etc.)
    const baseUrl = validateCustomBaseUrl(env.CUSTOM_LLM_BASE_URL ?? '');
    const endpointUrl = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl}/chat/completions`;
    const apiKey = isRealSecret(env.CUSTOM_LLM_API_KEY)
      ? env.CUSTOM_LLM_API_KEY?.trim()
      : undefined;

    return callOpenAiCompatibleEndpoint({
      provider: 'custom',
      endpointUrl,
      apiKey,
      model,
      systemInstruction: fullSystem,
      userPrompt: params.userPrompt,
      enforceJsonFormat: false,
    });
  });

  const jsonStr = extractJsonObject(rawText);
  try {
    const parsed = JSON.parse(jsonStr) as T;
    return { data: parsed, provider: providerId, model };
  } catch {
    throw new Error(`${PROVIDER_LABELS[providerId]} returned malformed JSON. Please retry.`);
  }
}
