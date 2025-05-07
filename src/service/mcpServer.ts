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
  CreateRecordArgsSchema,
  UpdateRecordArgsSchema,
  CreateTableArgsSchema,
  UpdateTableArgsSchema,
  SearchRecordsArgsSchema,
  GetAppTokenArgs,
  IBaseService,
  IBaseMCPServer,
  CreateBaseArgsSchema,
  UpdateBaseArgsSchema,
  GetBaseArgsSchema,
  CopyBaseArgsSchema,
  UpdateFieldArgsSchema,
  ListFieldsArgsSchema,
  CreateFieldArgsSchema,
  CommonFieldArgsSchema,
  CommonTableArgsSchema,
  RecordArgsSchema,
  CreateBatchRecordArgsSchema,
  GetAppTokenArgsSchema,
} from '../types/types.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { currentVersion } from '../utils/version.js';
import { uuid } from '../utils/utils.js';

const getInputSchema = (schema: z.ZodType<object>): ListToolsResult['tools'][0]['inputSchema'] => {
  const jsonSchema = zodToJsonSchema(schema);
  if (!('type' in jsonSchema) || jsonSchema.type !== 'object') {
    throw new Error(
      `Invalid input schema to convert in base-mcp-server: expected an object but got ${'type' in jsonSchema ? jsonSchema.type : 'no type'}`,
    );
  }
  return { ...jsonSchema, type: 'object' };
};

const formatToolResponse = (data: unknown, isError = false): CallToolResult => {
  // console.log('>>>formatToolResponse', data, isError);

  if (typeof data === 'object' && data !== null && 'useMarkdown' in data && 'content' in data) {
    return {
      content: [
        {
          type: 'text',
          mimeType: 'text/x-markdown',
          text: JSON.stringify(data.content),
        },
      ],
      isError,
    };
  }

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

export class BaseMCPServer implements IBaseMCPServer {
  private server: Server;

  private baseService: IBaseService;

  private stdioUUID: string;

  private readonly SCHEMA_PATH = 'schema';

  constructor(baseService: IBaseService) {
    this.baseService = baseService;
    this.stdioUUID = uuid();
    // this.stdioUUID = '123';
    this.server = new Server(
      {
        name: 'base-mcp-server',
        version: currentVersion,
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
    // this.server.setRequestHandler(ListResourcesRequestSchema, this.handleListResources.bind(this));
    // this.server.setRequestHandler(ReadResourceRequestSchema, this.handleReadResource.bind(this));
    this.server.setRequestHandler(ListToolsRequestSchema, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequestSchema, this.handleCallTool.bind(this));
  }

  // private async handleListResources(): Promise<ListResourcesResult> {
  //   const { tables, baseToken } = await this.baseService.listTables();
  //   return {
  //     resources: [
  //       ...tables.map((item) => ({
  //         uri: `basetable://${baseToken}/${item.table_id}/${this.SCHEMA_PATH}`,
  //         name: item.name ?? '',
  //         tableName: item.name ?? '',
  //       }))
  //     ],
  //   };
  // }

  // private async handleReadResource(request: z.infer<typeof ReadResourceRequestSchema>): Promise<ReadResourceResult> {
  //   const { uri, sessionId } = request.params;
  //   // Handle basetable resources
  //   const match = uri.match(/^basetable:\/\/([^/]+)\/([^/]+)\/schema$/);
  //   if (!match || !match[1] || !match[2]) {
  //     throw new Error('Invalid resource URI');
  //   }
  //   const [, baseId, tableId] = match;
  //   const fields = await this.baseService.listFields(sessionId as string, tableId);
  //   return {
  //     contents: [
  //       {
  //         uri,
  //         text: JSON.stringify({
  //           params: request.params,
  //           tableId,
  //           baseId,
  //           fields,
  //         }),
  //       },
  //     ],
  //   };
  // }

  private async handleListTools(): Promise<ListToolsResult> {
    return {
      tools: [
        {
          name: 'get_authorization_url_or_token',
          description:
            'Get authorization to generate user_access_token. If this tool returns a url, generate a hyperlink to guide the user to visit the URL and authorize and then use this tool again to get token. If this tool returns a user_access_token, just return it and don`t generate a hyperlink.',
          inputSchema: getInputSchema(z.object({})),
        },
        // {
        //   name: 'get_authorization_token',
        //   description: 'Get user_access_token for base tools calling. If the user has already acquired the token, skip this step.',
        //   inputSchema: getInputSchema(z.object({})),
        // },
        {
          name: 'get_app_token',
          description: 'Get app_token from a url if the user wants to operate with base',
          inputSchema: getInputSchema(GetAppTokenArgsSchema),
        },
        {
          name: 'list_records',
          description: 'List records from a table',
          inputSchema: getInputSchema(ListRecordsArgsSchema),
        },
        {
          name: 'list_tables',
          description: 'List tables from a app',
          inputSchema: getInputSchema(ListTablesArgsSchema),
        },
        {
          name: 'create_base',
          description: 'Create a new base in a app',
          inputSchema: getInputSchema(CreateBaseArgsSchema),
        },
        {
          name: 'update_base',
          description: 'Update an existing base in a app',
          inputSchema: getInputSchema(UpdateBaseArgsSchema),
        },
        {
          name: 'get_base',
          description: 'Get information about a specific base',
          inputSchema: getInputSchema(GetBaseArgsSchema),
        },
        {
          name: 'copy_base',
          description: 'Copy a base to another app',
          inputSchema: getInputSchema(CopyBaseArgsSchema),
        },
        {
          name: 'create_table',
          description: 'Create a new table in a app',
          inputSchema: getInputSchema(CreateTableArgsSchema),
        },
        {
          name: 'update_table',
          description: 'Update a table in a app',
          inputSchema: getInputSchema(UpdateTableArgsSchema),
        },
        // {
        //   name: 'delete_table',
        //   description: 'Delete a table in a app',
        //   inputSchema: getInputSchema(CommonTableArgsSchema),
        // },
        // {
        //   name: 'list_fields',
        //   description: 'List all fields in a table',
        //   inputSchema: getInputSchema(ListFieldsArgsSchema),
        // },
        // {
        //   name: 'create_field',
        //   description: 'Create a new field in a table',
        //   inputSchema: getInputSchema(CreateFieldArgsSchema),
        // },
        {
          name: 'update_field',
          description: 'Update a field in a table',
          inputSchema: getInputSchema(UpdateFieldArgsSchema),
        },
        {
          name: 'delete_field',
          description: 'Delete a field in a table',
          inputSchema: getInputSchema(CommonFieldArgsSchema),
        },
        {
          name: 'create_record',
          description: 'Create a new record in a table',
          inputSchema: getInputSchema(CreateRecordArgsSchema),
        },
        {
          name: 'delete_record',
          description: 'Delete a record from a table',
          inputSchema: getInputSchema(RecordArgsSchema),
        },
        {
          name: 'update_record',
          description: 'Update an existing record in a table',
          inputSchema: getInputSchema(
            z.object({
              path: RecordArgsSchema,
              data: z.object({
                // todo 这里先any，要不然cursor 报错 your message is too long
                fields: z.any(),
              }),
            }),
          ),
        },
        {
          name: 'get_record',
          description: 'Get a single record by ID',
          inputSchema: getInputSchema(RecordArgsSchema),
        },
      ],
    };
  }

  private async handleCallTool(request: z.infer<typeof CallToolRequestSchema>): Promise<CallToolResult> {
    try {
      const transport = this.server.transport;
      let sessionId = transport?.sessionId as string;
      if (transport instanceof SSEServerTransport) {
        if (!sessionId) {
          throw new Error('Session ID is required');
        }
      } else if (transport instanceof StdioServerTransport) {
        sessionId = this.stdioUUID;
      }

      switch (request.params.name) {
        case 'get_authorization_url_or_token': {
          const base = await this.baseService.getAuthUrlOrToken(sessionId);
          return formatToolResponse(base);
        }
        // case 'get_authorization_token': {
        //   const base = await this.baseService.getAuthToken(sessionId);
        //   return formatToolResponse(base);
        // }
        case 'get_app_token': {
          const args = GetAppTokenArgsSchema.parse(request.params.arguments);
          const base = await this.baseService.getAppToken(args, sessionId);
          return formatToolResponse(base);
        }
        case 'create_base': {
          const args = CreateBaseArgsSchema.parse(request.params.arguments);
          const base = await this.baseService.createBase(args, sessionId);
          return formatToolResponse(base);
        }
        case 'update_base': {
          const args = UpdateBaseArgsSchema.parse(request.params.arguments);
          const base = await this.baseService.updateBase(args, sessionId);
          return formatToolResponse(base);
        }
        case 'get_base': {
          const args = GetBaseArgsSchema.parse(request.params.arguments);
          const base = await this.baseService.getBase(args, sessionId);
          return formatToolResponse(base);
        }
        case 'copy_base': {
          const args = CopyBaseArgsSchema.parse(request.params.arguments);
          const base = await this.baseService.copyBase(args, sessionId);
          return formatToolResponse(base);
        }
        case 'list_tables': {
          const args = ListTablesArgsSchema.parse(request.params.arguments);
          const records = await this.baseService.listTables(args, sessionId);
          return formatToolResponse(records);
        }
        case 'create_table': {
          const args = CreateTableArgsSchema.parse(request.params.arguments);
          const table = await this.baseService.createTable(args, sessionId);
          return formatToolResponse(table);
        }
        case 'update_table': {
          const args = UpdateTableArgsSchema.parse(request.params.arguments);
          const table = await this.baseService.updateTable(args, sessionId);
          return formatToolResponse(table);
        }
        case 'delete_table': {
          const args = CommonTableArgsSchema.parse(request.params.arguments);
          const table = await this.baseService.deleteTable(args, sessionId);
          return formatToolResponse(table);
        }
        case 'list_records': {
          const args = ListRecordsArgsSchema.parse(request.params.arguments);
          const records = await this.baseService.listRecords(args, sessionId);
          return formatToolResponse(records);
        }
        case 'list_fields': {
          const args = ListFieldsArgsSchema.parse(request.params.arguments);
          const fields = await this.baseService.listFields(args, sessionId);
          return formatToolResponse(fields);
        }
        case 'create_field': {
          const args = CreateFieldArgsSchema.parse(request.params.arguments);
          const field = await this.baseService.createField(args, sessionId);
          return formatToolResponse(field);
        }
        case 'update_field': {
          const args = UpdateFieldArgsSchema.parse(request.params.arguments);
          const field = await this.baseService.updateField(args, sessionId);
          return formatToolResponse(field);
        }
        case 'delete_field': {
          const args = CommonFieldArgsSchema.parse(request.params.arguments);
          const { success } = await this.baseService.deleteField(args, sessionId);
          return formatToolResponse({ success });
        }
        case 'create_record': {
          const args = CreateRecordArgsSchema.parse(request.params.arguments);
          const record = await this.baseService.createRecord(args, sessionId);
          return formatToolResponse(record);
        }
        case 'delete_record': {
          const args = RecordArgsSchema.parse(request.params.arguments);
          const { success } = await this.baseService.deleteRecord(args, sessionId);
          return formatToolResponse({ success });
        }
        case 'update_record': {
          const args = UpdateRecordArgsSchema.parse(request.params.arguments);
          const record = await this.baseService.updateRecord(args, sessionId);
          return formatToolResponse(record);
        }
        case 'get_record': {
          const args = RecordArgsSchema.parse(request.params.arguments);
          const record = await this.baseService.getRecord(args, sessionId);
          return formatToolResponse(record);
        }
        // case 'create_batch_record': {
        //   const args = CreateBatchRecordArgsSchema.parse(request.params.arguments);
        //   const records = await this.baseService.createBatchRecord(args, sessionId);
        //   return formatToolResponse(records);
        // }
        default: {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    } catch (error) {
      return formatToolResponse(`Error in tool ${request.params.name}: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
