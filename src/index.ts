#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { BaseService } from "./baseService.js";
import { AirtableMCPServer } from "./mcpServer.js";
import express, { Request, Response } from "express";


const PORT = process.env.PORT || 3001;
const sseConnections = new Map<string, { res: Response, intervalId: NodeJS.Timeout }>();
const KEEP_ALIVE_INTERVAL_MS = 25000; // Send keep-alive every 25 seconds

const main = async () => {
  const baseSerivce = new BaseService(
    "VX0QbQw4gat8zHsi8qfcEOzAntc",
    "pt-RoQSssJqs5IVCZKBBN52dS11bNVfg2j8ZwRT_meWAQAAEwABhwQARh_oy5k5"
  );
  const server = new AirtableMCPServer(baseSerivce);

  const app = express();

  const transports: { [sessionId: string]: SSEServerTransport } = {};

  // app.get("/sse", async (_, res) => {
  //   const transport = new SSEServerTransport("/messages", res);
  //   transports[transport.sessionId] = transport;
  //   res.on("close", () => {
  //     delete transports[transport.sessionId];
  //   });
  //   await server.connect(transport);
  // });

  app.get("/sse", async (_: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res)
    const sessionId = transport.sessionId; // Get session ID from transport
    transports[sessionId] = transport;
  
    // Start keep-alive ping
    const intervalId = setInterval(() => {
      if (sseConnections.has(sessionId) && !res.writableEnded) {
        res.write(': keepalive\n\n');
      } else {
        // Should not happen if close handler is working, but clear just in case
        clearInterval(intervalId);
        sseConnections.delete(sessionId);
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  
    // Store connection details
    sseConnections.set(sessionId, { res, intervalId });
    console.log(`[SSE Connection] Client connected: ${sessionId}, starting keep-alive.`);
  
    res.on("close", () => {
      console.log(`[SSE Connection] Client disconnected: ${sessionId}, stopping keep-alive.`);
      // Clean up transport
      delete transports[sessionId];
      // Clean up keep-alive interval
      const connection = sseConnections.get(sessionId);
      if (connection) {
        clearInterval(connection.intervalId);
        sseConnections.delete(sessionId);
      }
    });
  
    // Connect server to transport *after* setting up handlers
    try {
      await server.connect(transport)
    } catch (error) {
      console.error(`[SSE Connection] Error connecting server to transport for ${sessionId}:`, error);
      // Ensure cleanup happens even if connect fails
      clearInterval(intervalId);
      sseConnections.delete(sessionId);
      delete transports[sessionId];
      if (!res.writableEnded) {
        res.status(500).end('Failed to connect MCP server to transport');
      }
    }
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

await main();
