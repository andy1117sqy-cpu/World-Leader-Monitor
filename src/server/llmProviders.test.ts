import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ProviderConfigError,
  buildAnthropicPayload,
  buildOpenAiCompatiblePayload,
  extractJsonObject,
  getConfiguredProviders,
  getDefaultProviderId,
  isValidProviderId,
  resolveRequestedProvider,
  validateCustomBaseUrl,
} from './llmProviders';

test('extractJsonObject parses plain, fenced, and prose-wrapped JSON', () => {
  assert.deepEqual(JSON.parse(extractJsonObject('{"headline":"Budget passes"}')), {
    headline: 'Budget passes',
  });

  const fenced = '```json\n{"headline":"Summit opens","turn":1}\n```';
  assert.deepEqual(JSON.parse(extractJsonObject(fenced)), {
    headline: 'Summit opens',
    turn: 1,
  });

  const proseWrapped =
    'Here is the simulation result:\n{"headline":"Treaty signed","nested":{"ok":true}}\nEnd of report.';
  assert.deepEqual(JSON.parse(extractJsonObject(proseWrapped)), {
    headline: 'Treaty signed',
    nested: { ok: true },
  });

  assert.throws(() => extractJsonObject('No braces here'), /did not contain a JSON object/);
});

test('getConfiguredProviders ignores placeholders and detects Gemini, OpenAI, Claude, DeepSeek, Custom', () => {
  const providers = getConfiguredProviders({
    GEMINI_API_KEY: 'MY_GEMINI_API_KEY',
    OPENAI_API_KEY: 'sk-test-openai-key',
    ANTHROPIC_API_KEY: 'sk-ant-test-key',
    DEEPSEEK_API_KEY: 'sk-ds-test-key',
    CUSTOM_LLM_BASE_URL: 'https://openrouter.ai/api/v1',
    CUSTOM_LLM_MODEL: 'meta-llama/llama-3.3-70b-instruct',
    CUSTOM_LLM_LABEL: 'OpenRouter',
  });

  assert.deepEqual(
    providers.map((p) => ({ id: p.id, label: p.label, model: p.model })),
    [
      { id: 'openai', label: 'ChatGPT (OpenAI)', model: 'gpt-4o-mini' },
      { id: 'anthropic', label: 'Claude (Anthropic)', model: 'claude-3-5-haiku-latest' },
      { id: 'deepseek', label: 'DeepSeek', model: 'deepseek-chat' },
      { id: 'custom', label: 'OpenRouter', model: 'meta-llama/llama-3.3-70b-instruct' },
    ]
  );
});

test('getDefaultProviderId respects LLM_PROVIDER env override when configured', () => {
  const env = {
    GEMINI_API_KEY: 'real-gemini-key',
    DEEPSEEK_API_KEY: 'real-deepseek-key',
    LLM_PROVIDER: 'deepseek',
  };
  assert.equal(getDefaultProviderId(env), 'deepseek');

  // Falls back to first configured if LLM_PROVIDER points to unconfigured provider
  assert.equal(
    getDefaultProviderId({
      GEMINI_API_KEY: 'real-gemini-key',
      LLM_PROVIDER: 'anthropic',
    }),
    'gemini'
  );
});

test('resolveRequestedProvider enforces strict allowlist and configured check', () => {
  const env = { GEMINI_API_KEY: 'real-gemini-key' };

  assert.equal(resolveRequestedProvider(undefined, env), 'gemini');
  assert.equal(resolveRequestedProvider('gemini', env), 'gemini');
  assert.equal(isValidProviderId('anthropic'), true);
  assert.equal(isValidProviderId('evil-provider'), false);

  assert.throws(
    () => resolveRequestedProvider('evil-provider', env),
    (err: unknown) => err instanceof ProviderConfigError && err.statusCode === 400
  );

  assert.throws(
    () => resolveRequestedProvider('anthropic', env),
    (err: unknown) =>
      err instanceof ProviderConfigError &&
      err.statusCode === 400 &&
      err.message.includes('ANTHROPIC_API_KEY')
  );
});

test('validateCustomBaseUrl allows valid endpoints and blocks metadata/unsafe schemes', () => {
  assert.equal(
    validateCustomBaseUrl('https://openrouter.ai/api/v1/'),
    'https://openrouter.ai/api/v1'
  );
  assert.equal(
    validateCustomBaseUrl('http://localhost:11434/v1'),
    'http://localhost:11434/v1'
  );
  assert.throws(() => validateCustomBaseUrl('file:///etc/passwd'));
  assert.throws(() => validateCustomBaseUrl('http://169.254.169.254/latest/meta-data'));
  assert.throws(() => validateCustomBaseUrl('http://metadata.google.internal/computeMetadata/v1'));
});

test('provider wire payload builders format OpenAI/DeepSeek and Anthropic requests cleanly', () => {
  const openAiBody = buildOpenAiCompatiblePayload({
    model: 'gpt-4o-mini',
    systemInstruction: 'System rules',
    userPrompt: 'Turn prompt',
    enforceJsonFormat: true,
  });
  assert.equal(openAiBody.model, 'gpt-4o-mini');
  assert.deepEqual(openAiBody.response_format, { type: 'json_object' });
  assert.equal((openAiBody.messages as Array<{ role: string }>).length, 2);

  const o3Body = buildOpenAiCompatiblePayload({
    model: 'o3-mini',
    systemInstruction: 'System rules',
    userPrompt: 'Turn prompt',
    enforceJsonFormat: true,
  });
  assert.equal('temperature' in o3Body, false);
  assert.deepEqual(o3Body.response_format, { type: 'json_object' });

  const r1Body = buildOpenAiCompatiblePayload({
    model: 'deepseek-reasoner',
    systemInstruction: 'System rules',
    userPrompt: 'Turn prompt',
    enforceJsonFormat: true,
  });
  assert.equal('temperature' in r1Body, false);
  assert.equal('response_format' in r1Body, false);

  const claudeBody = buildAnthropicPayload({
    model: 'claude-3-5-haiku-latest',
    systemInstruction: 'System rules',
    userPrompt: 'Turn prompt',
  });
  assert.equal(claudeBody.model, 'claude-3-5-haiku-latest');
  assert.equal(claudeBody.system, 'System rules');
  assert.equal(claudeBody.max_tokens, 2048);
  assert.deepEqual(claudeBody.messages, [{ role: 'user', content: 'Turn prompt' }]);
});
