#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { BaseService } from "./baseService.js";
import { AirtableMCPServer } from "./mcpServer.js";
import express, { Request, Response } from "express";
import { sessionManager } from "./sessionManager.js";

const PORT = process.env.PORT || 3001;
const KEEP_ALIVE_INTERVAL_MS = 25000; // Send keep-alive every 25 seconds

const main = async () => {
  const baseSerivce = new BaseService();
  const server = new AirtableMCPServer(baseSerivce);

  const app = express();

  app.get("/sse", async (req: Request, res: Response) => {
    console.log(`[SSE Connection] Client connected`);

    const { appToken, personalBaseToken } = req.query;
    
    if (!appToken || !personalBaseToken) {
      res.status(400).send('Missing appToken or personalBaseToken');
      return;
    }

    const transport = new SSEServerTransport('/messages', res)
    const sessionId = transport.sessionId;
    
    // Initialize session with transport
    sessionManager.createSession(sessionId, appToken as string, personalBaseToken as string, transport);
  
    // Start keep-alive ping
    const intervalId = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keepalive\n\n');
      } else {
        clearInterval(intervalId);
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  
    console.log(`[SSE Connection] Client connected: ${sessionId}, starting keep-alive.`);
  
    res.on("close", () => {
      console.log(`[SSE Connection] Client disconnected: ${sessionId}, stopping keep-alive.`);
      clearInterval(intervalId);
      sessionManager.deleteSession(sessionId);
    });
  
    try {
      await server.connect(transport)
    } catch (error) {
      console.error(`[SSE Connection] Error connecting server to transport for ${sessionId}:`, error);
      clearInterval(intervalId);
      sessionManager.deleteSession(sessionId);
      if (!res.writableEnded) {
        res.status(500).end('Failed to connect MCP server to transport');
      }
    }
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = sessionManager.getTransport(sessionId);
    if (transport instanceof SSEServerTransport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

main().catch(console.error);
