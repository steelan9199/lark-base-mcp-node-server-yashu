#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { BaseService } from "./baseService.js";
import { AirtableMCPServer } from "./mcpServer.js";
import express from "express";

const main = async () => {
  const baseSerivce = new BaseService(
    "VX0QbQw4gat8zHsi8qfcEOzAntc",
    "pt-RoQSssJqs5IVCZKBBN52dS11bNVfg2j8ZwRT_meWAQAAEwABhwQARh_oy5k5"
  );
  const server = new AirtableMCPServer(baseSerivce);

  const app = express();

  const transports: { [sessionId: string]: SSEServerTransport } = {};

  app.get("/sse", async (_, res) => {
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
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

  app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
  });
};

await main();
