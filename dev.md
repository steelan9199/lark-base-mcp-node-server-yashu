## MCP server
1. npm i
2. npm run build
## MCP inpsector
### stdio
1. npx @modelcontextprotocol/inspector ./dist/index.js
2. 使用stdio 方式
### sse
1. npm dev
2. npx @modelcontextprotocol/inspector
3. 使用SSE方式，连接到 http://localhost:3001/sse?appToken=${多维表格APPToken}&personalBaseToken=${该多维表格的授权码}
