#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BaseService } from './baseService.js';
import { AirtableMCPServer } from './mcpServer.js';

const main = async () => {

// export const main = async () => {
  // if (apiKey) {
  //   // Deprecation warning
  //   console.warn(
  //     'warning (airtable-mcp-server): Passing in an API key as a command-line argument is deprecated and may be removed in a future version. Instead, set the `AIRTABLE_API_KEY` environment variable. See https://github.com/domdomegg/airtable-mcp-server/blob/master/README.md#usage for an example with Claude Desktop.',
  //   );
  // }

  // const airtableService = new BaseService(
  //   'VX0QbQw4gat8zHsi8qfcEOzAntc',
  //   'pt-zk5G1P1K2ZJ9MVGz_MJFis2mpFpfg2j8Z-rz_GeWAQAAEwABhxNAwKW1FBk0',
  // );

  // const baseSerivce = new BaseService(
  //   'PIkWbwo80aezlhsaX9uc5GIAnfe',
  //   'pt-zk5G1P1K2ZJ9MVGz_MJFis2mpFpfg2j8Z-rz_GeWAQAAEwABhxNAwKW1FBk0',
  // );
  const baseSerivce = new BaseService(
    // 'WFycwS5MEinQZOkP8mRc2AGNndc',
    'VX0QbQw4gat8zHsi8qfcEOzAntc',
    'pt-RoQSssJqs5IVCZKBBN52dS11bNVfg2j8ZwRT_meWAQAAEwABhwQARh_oy5k5',
    // 'pt-zk5G1P1K2ZJ9MVGz_MJFis2mpFpfg2j8Z-rz_GeWAQAAEwABhxNAwKW1FBk0',
  );
  const server = new AirtableMCPServer(baseSerivce);
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

// Only call main directly if this file is being run directly (not imported)
// if (import.meta.url === import.meta.resolve('./index.js')) {
//   await main();
// }
await main();