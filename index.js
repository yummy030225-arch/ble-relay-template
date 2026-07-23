import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let toyQueue = { command: null, timestamp: 0 };

app.get('/', (req, res) => { res.json({ status: 'ok' }); });

app.get('/toy-next', (req, res) => {
    if (Date.now() - toyQueue.timestamp > 5000) return res.json({ command: null });
    const cmd = toyQueue.command;
    toyQueue.command = null;
    res.json({ command: cmd });
});

app.post('*', (req, res) => {
    const { jsonrpc, id, method, params } = req.body;
    console.log(`📨 MCP 请求: ${method} (路径: ${req.path})`);
    if (method === 'initialize') {
        return res.json({ jsonrpc: '2.0', id, result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'ble-mcp-bridge', version: '1.0.0' } } });
    }
    if (method === 'tools/list') {
        return res.json({ jsonrpc: '2.0', id, result: { tools: [] } });
    }
    if (method === 'tools/call') {
        const toolName = params?.name;
        const args = params?.arguments || {};
        toyQueue.command = { action: toolName, args };
        toyQueue.timestamp = Date.now();
        return res.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `✅ 指令已入队: ${toolName}` }] } });
    }
    res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32601, message: `未知方法: ${method}` } });
});

app.listen(PORT, () => { console.log(`🚀 服务运行在端口 ${PORT}`); });
