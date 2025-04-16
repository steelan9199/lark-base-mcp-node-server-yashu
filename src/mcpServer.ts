import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  ListToolsResult,
  ReadResourceResult,
  ListResourcesResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  ListRecordsArgsSchema,
  ListTablesArgsSchema,
  DescribeTableArgsSchema,
  GetRecordArgsSchema,
  CreateRecordArgsSchema,
  UpdateRecordsArgsSchema,
  DeleteRecordsArgsSchema,
  CreateTableArgsSchema,
  UpdateTableArgsSchema,
  CreateFieldArgsSchema,
  UpdateFieldArgsSchema,
  SearchRecordsArgsSchema,
  GetAppTokenArgsSchema,
  // IAirtableService,
  IBaseService,
  IAirtableMCPServer,
} from './types.js';

const getInputSchema = (schema: z.ZodType<object>): ListToolsResult['tools'][0]['inputSchema'] => {
  const jsonSchema = zodToJsonSchema(schema);
  if (!('type' in jsonSchema) || jsonSchema.type !== 'object') {
    throw new Error(
      `Invalid input schema to convert in airtable-mcp-server: expected an object but got ${
        'type' in jsonSchema ? jsonSchema.type : 'no type'
      }`,
    );
  }
  return { ...jsonSchema, type: 'object' };
};

const formatToolResponse = (data: unknown, isError = false): CallToolResult => {
  return {
    content: [
      {
        type: 'text',
        mimeType: 'application/json',
        text: JSON.stringify(data),
      },
    ],
    isError,
  };
};

export class AirtableMCPServer implements IAirtableMCPServer {
  private server: Server;

  private airtableService: IBaseService;

  private readonly SCHEMA_PATH = 'schema';

  constructor(airtableService: IBaseService) {
    this.airtableService = airtableService;
    this.server = new Server(
      {
        name: 'airtable-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    );
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, this.handleListResources.bind(this));
    this.server.setRequestHandler(ReadResourceRequestSchema, this.handleReadResource.bind(this));
    this.server.setRequestHandler(ListToolsRequestSchema, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequestSchema, this.handleCallTool.bind(this));
  }

  private async handleListResources(): Promise<ListResourcesResult> {
    const { tables, baseToken } = await this.airtableService.listTables();
    return {
      resources: tables.map((item) => ({
        uri: `basetable://${baseToken}/${item.table_id}/${this.SCHEMA_PATH}`,
        name: item.name ?? '',
        tableName: item.name ?? '',
      })),
    };
  }

  private async handleReadResource(request: z.infer<typeof ReadResourceRequestSchema>): Promise<ReadResourceResult> {
    const { uri } = request.params;
    const match = uri.match(/^basetable:\/\/([^/]+)\/([^/]+)\/schema$/);

    if (!match || !match[1] || !match[2]) {
      throw new Error('Invalid resource URI');
    }
    const [, baseId, tableId] = match;
    const fields = await this.airtableService.listFields(tableId);
    return {
      contents: [
        {
          uri,
          text: JSON.stringify({
            params: request.params,
            tableId,
            baseId,
            fields,
          }),
        },
      ],
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async handleListTools(): Promise<ListToolsResult> {
    return {
      tools: [
        {
          name: 'list_records',
          description: 'List records from a table',
          inputSchema: getInputSchema(ListRecordsArgsSchema),
        },
        // {
        //   name: 'get_app_token',
        //   description: 'Get app token from wiki token',
        //   inputSchema: getInputSchema(GetAppTokenArgsSchema),
        // },
        {
          name: 'list_tables',
          description: 'List tables from a app',
          inputSchema: getInputSchema(ListTablesArgsSchema),
        },
        {
          name: 'create_record',
          description: 'Create a new record in a table',
          inputSchema: getInputSchema(CreateRecordArgsSchema),
        },
      ],
    };
  }

  private async handleCallTool(request: z.infer<typeof CallToolRequestSchema>): Promise<CallToolResult> {
    try {
      switch (request.params.name) {
        case 'list_tables': {
          // const args = ListRecordsArgsSchema.parse(request.params.arguments);
          const records = await this.airtableService.listTables();
          return formatToolResponse(records);
        }
        case 'list_records': {
          const args = ListRecordsArgsSchema.parse(request.params.arguments);
          const records = await this.airtableService.listRecords(args.tableId);
          return formatToolResponse(records);
        }
        // case 'get_app_token': {
        //   const args = GetAppTokenArgsSchema.parse(request.params.arguments);
        //   const appToken = await this.airtableService.createRecord(args.wikiToken);
        //   return formatToolResponse(appToken);
        // }
        case 'create_record': {
          const args = CreateRecordArgsSchema.parse(request.params.arguments);
          const record = await this.airtableService.createRecord(args.tableId, args.fields);
          return formatToolResponse({
            id: record.record_id,
            createBy: record.created_by?.name,
            createTime: record.created_time,
            fields: record.fields,
          });
        }

        default: {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    } catch (error) {
      return formatToolResponse(
        `Error in tool ${request.params.name}: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
