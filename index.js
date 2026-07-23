import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let toyQueue = { command: null, timestamp: 0 };

app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/toy-next', (req, res) => {
    if (Date.now() - toyQueue.timestamp > 5000) {
        return res.json({ command: null });
    }
    const cmd = toyQueue.command;
    toyQueue.command = null;
    res.json({ command: cmd });
});

app.post('*', (req, res) => {
    const { jsonrpc, id, method, params } = req.body;
    console.log(`📨 MCP 请求: ${method} (路径: ${req.path})`);

    if (method === 'initialize') {
        return res.json({
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion: '2025-03-26',
                capabilities: { tools: {} },
                serverInfo: { name: 'ble-mcp-bridge', version: '1.0.0' }
            }
        });
    }

    if (method === 'tools/list') {
        return res.json({
            jsonrpc: '2.0',
            id,
            result: {
                tools: [
                    { name: 'vibrate', description: '控制震动 (模式1-10，强度0-100)', inputSchema: { type: 'object', properties: { mode: { type: 'number', minimum: 1, maximum: 10 }, level: { type: 'number', minimum: 0, maximum: 100 } }, required: ['mode', 'level'] } },
                    { name: 'suction', description: '控制吮吸 (模式1-5，强度0-100)', inputSchema: { type: 'object', properties: { mode: { type: 'number', minimum: 1, maximum: 5 }, level: { type: 'number', minimum: 0, maximum: 100 } }, required: ['mode', 'level'] } },
                    { name: 'heat', description: '开关加热', inputSchema: { type: 'object', properties: { on: { type: 'boolean' } }, required: ['on'] } },
                    { name: 'rotate', description: '控制伸缩转珠 (模式0-7，0停止)', inputSchema: { type: 'object', properties: { mode: { type: 'number', minimum: 0, maximum: 7 } }, required: ['mode'] } },
                    { name: 'stop_rotate', description: '停止伸缩转珠', inputSchema: { type: 'object', properties: {} } },
                    { name: 'stop_all', description: '紧急停止所有功能', inputSchema: { type: 'object', properties: {} } }
                ]
            }
        });
    }

    if (method === 'tools/call') {
        const toolName = params?.name;
        const args = params?.arguments || {};
        toyQueue.command = { action: toolName, args };
        toyQueue.timestamp = Date.now();
        return res.json({
            jsonrpc: '2.0',
            id,
            result: {
                content: [{ type: 'text', text: `✅ 指令已入队: ${toolName}` }]
            }
        });
    }

    res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `未知方法: ${method}` }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 服务运行在端口 ${PORT}`);
});
