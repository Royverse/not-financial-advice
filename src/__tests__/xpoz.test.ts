import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// We can't easily import the .mts file directly in vitest without setup, 
// so let's replicate the parsing logic to see if it's brittle.

function mcpParser(data: string) {
    const lines = data.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const parsed = JSON.parse(line.substring(6));
                if (parsed.result && parsed.result.content && parsed.result.content[0].text) {
                    return parsed.result.content[0].text;
                }
            } catch (e) {
                // Skip invalid JSON lines
            }
        }
    }
    return null;
}

describe('Xpoz Response Parsing', () => {
    it('should parse standard SSE format', () => {
        const sseData = 'data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"operationId: op_123"}]}}';
        const result = mcpParser(sseData);
        expect(result).toBe('operationId: op_123');
    });

    it('should handle multiple lines and heartbeats', () => {
        const sseData = ':\n\ndata: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"actual_result"}]}}\n\n';
        const result = mcpParser(sseData);
        expect(result).toBe('actual_result');
    });

    it('should fail if data is not prefixed with data:', () => {
        const jsonData = '{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"actual_result"}]}}';
        const result = mcpParser(jsonData);
        expect(result).toBeNull(); // This is the bug! If Xpoz returns plain JSON, it fails.
    });

    it('should fail if result is nested differently', () => {
        const sseData = 'data: {"result": "simple string"}';
        const result = mcpParser(sseData);
        expect(result).toBeNull();
    });
});
