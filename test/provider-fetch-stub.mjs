const scenario = process.env.PROVIDER_TEST_SCENARIO || 'fallback-success';
let openaiCalls = 0;
let anthropicCalls = 0;

function response(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function uploadedFileId(task) {
  const match = String(task || '').match(/file_id:\\s*([0-9a-f-]{36})/i);
  return match?.[1] || '00000000-0000-4000-8000-000000000000';
}

function recordExcelToolResult(raw) {
  try {
    const parsed = JSON.parse(String(raw || ''));
    const serialized = JSON.stringify(parsed);
    const success = parsed?.ok === true;
    const includesWorkbookData = serialized.includes('round trip');
    process.stdout.write('MOCK_EXCEL_TOOL_RESULT:' + (success ? 'ok' : 'error') + (includesWorkbookData ? ':data' : '') + '\\n');
  } catch {
    process.stdout.write('MOCK_EXCEL_TOOL_RESULT:error\\n');
  }
}

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  let provider;
  if (url.includes('api.openai.com')) provider = 'openai';
  else if (url.includes('api.anthropic.com')) provider = 'anthropic';
  else if (url.includes('openrouter.ai')) provider = 'openrouter';
  else throw new Error('Unexpected provider URL in test: ' + url);

  const body = (() => { try { return JSON.parse(init.body || '{}'); } catch { return {}; } })();
  process.stdout.write('PROVIDER_MOCK_CALL:' + provider + '\\n');

  if (provider === 'openai') {
    openaiCalls++;
    if (scenario === 'excel-inspect-openai') {
      if (openaiCalls === 1) {
        const available = (body.tools || []).filter(tool => tool.type === 'function').map(tool => tool.name);
        process.stdout.write('MOCK_EXCEL_TOOLS:' + available.join(',') + '\\n');
        return response(200, {
          model: 'gpt-4.1',
          output: [{
            type: 'function_call', call_id: 'call_excel_inspect',
            name: 'excel_inspect',
            arguments: JSON.stringify({ file_id: uploadedFileId(body.input) })
          }]
        });
      }
      if (Array.isArray(body.input) && body.input.some(item => item.type === 'function_call_output')) {
        const toolResult = body.input.find(item => item.type === 'function_call_output');
        recordExcelToolResult(toolResult?.output);
        return response(200, {
          model: 'gpt-4.1',
          output: [{ type: 'message', content: [{ type: 'output_text', text: 'OpenAI inspected the uploaded workbook.' }] }]
        });
      }
      return response(400, { error: { message: 'Expected an Excel function call round trip.' } });
    }
    if (scenario === 'excel-generate-openai') {
      if (openaiCalls === 1) {
        const available = (body.tools || []).filter(tool => tool.type === 'function').map(tool => tool.name);
        process.stdout.write('MOCK_EXCEL_TOOLS:' + available.join(',') + '\\n');
        return response(200, {
          model: 'gpt-4.1',
          output: [{
            type: 'function_call', call_id: 'call_excel_generate',
            name: 'excel_generate',
            arguments: JSON.stringify({
              sheets: [{
                name: 'Report',
                headers: ['ID', 'Amount'],
                rows: [['A-1', 12.5]]
              }]
            })
          }]
        });
      }
      if (Array.isArray(body.input) && body.input.some(item => item.type === 'function_call_output')) {
        process.stdout.write('MOCK_EXCEL_TOOL_RESULT:received\\n');
        return response(200, {
          model: 'gpt-4.1',
          output: [{ type: 'message', content: [{ type: 'output_text', text: 'Your workbook is ready.' }] }]
        });
      }
      return response(400, { error: { message: 'Expected an Excel generation round trip.' } });
    }
    if (scenario === 'primary-success') {
      return response(200, {
        model: 'gpt-4.1',
        output: [{ content: [{ type: 'output_text', text: 'Primary OpenAI answer.' }] }]
      });
    }
  }

  if (provider === 'anthropic' && scenario === 'excel-inspect-claude') {
    anthropicCalls++;
    if (anthropicCalls === 1) {
      const available = (body.tools || []).map(tool => tool.name);
      process.stdout.write('MOCK_EXCEL_TOOLS:' + available.join(',') + '\\n');
      return response(200, {
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'tool_use',
        content: [{
          type: 'tool_use', id: 'toolu_excel_inspect',
          name: 'excel_inspect',
          input: { file_id: uploadedFileId(body.messages?.[0]?.content) }
        }]
      });
    }
    if (body.messages?.some(message => message.role === 'user' && Array.isArray(message.content) && message.content.some(item => item.type === 'tool_result'))) {
      const toolResult = body.messages.find(message => message.role === 'user' && Array.isArray(message.content))?.content.find(item => item.type === 'tool_result');
      recordExcelToolResult(toolResult?.content);
      return response(200, {
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Claude inspected the uploaded workbook.' }]
      });
    }
  }

  if (provider === 'openrouter' && scenario === 'fallback-success') {
    return response(200, {
      model: 'nvidia/nemotron-3.5-lightning:free',
      choices: [{ message: { content: 'OpenRouter fallback answer.' } }]
    });
  }

  if (provider === 'openrouter' && scenario === 'fallback-failure') {
    return response(429, { error: { message: 'Mock OpenRouter rate limit.' } });
  }

  return response(provider === 'openai' ? 429 : 400, {
    error: { message: provider === 'openai' ? 'Mock OpenAI credits exhausted.' : 'Mock Anthropic balance too low.' }
  });
};
