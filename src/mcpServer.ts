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
  GetTableSchemaArgsSchema,
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
  console.log('>>>formatToolResponse', data, isError);
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
      resources: [
        ...tables.map((item) => ({
          uri: `basetable://${baseToken}/${item.table_id}/${this.SCHEMA_PATH}`,
          name: item.name ?? '',
          tableName: item.name ?? '',
        })),
        {
          uri: 'text://field-info-prompt',
          name: 'field-info-prompt',
        }
      ],
    };
  }

  private async handleReadResource(request: z.infer<typeof ReadResourceRequestSchema>): Promise<ReadResourceResult> {
    const { uri, sessionId } = request.params;
    
    // Handle text resource
    if (uri === "text://field-info-prompt") {
      return {
        contents: [
          {
            uri,
            text: `Rules: 	
-要新增的记录的数据。你需先指定数据表中的字段（即指定列），再传入正确格式的数据作为一条记录。
-注意：
-记录字段类型及其描述如下所示：

-文本： 填写字符串格式的值
-数字：填写数字格式的值
-单选：填写选项值，对于新的选项值，将会创建一个新的选项
-多选：填写多个选项值，对于新的选项值，将会创建一个新的选项。如果填写多个相同的新选项值，将会创建多个相同的选项
-日期：填写毫秒级时间戳
-复选框：填写 true 或 false
-条码：
-人员：填写用户的open_id、union_id 或 user_id，类型需要与 user_id_type 指定的类型一致
-电话号码：填写文本内容
-超链接：参考以下示例，text 为文本值，link 为 URL 链接
-附件：填写附件 token，需要先调用上传素材或分片上传素材接口将附件上传至该多维表格中
-单向关联：填写被关联表的记录 ID
-双向关联：填写被关联表的记录 ID
-地理位置：填写经纬度坐标，字符串格式拼接经纬度，例如："114.31,30.57"`,
          },
        ],
      };
    }

    // Handle basetable resources
    const match = uri.match(/^basetable:\/\/([^/]+)\/([^/]+)\/schema$/);
    if (!match || !match[1] || !match[2]) {
      throw new Error('Invalid resource URI');
    }
    const [, baseId, tableId] = match;
    const fields = await this.airtableService.listFields(sessionId as string, tableId);
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

  private async handleListTools(): Promise<ListToolsResult> {
    return {
      tools: [
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
          name: 'create_table',
          description: 'Create a new table in a app',
          inputSchema: getInputSchema(CreateTableArgsSchema),
        },
        {
          name: 'update_table',
          description: 'Update a table in a app',
          inputSchema: getInputSchema(UpdateTableArgsSchema),
        },
        {
          name: 'delete_table',
          description: 'Delete a table in a app',
          inputSchema: getInputSchema(z.object({
            tableId: z.string(),
          })),
        },
        {
          name: 'list_fields',
          description: 'List all fields in a table',
          inputSchema: getInputSchema(z.object({
            tableId: z.string(),
          })),
        },
        {
          name: 'create_field',
          description: 'Create a new field in a table',
          inputSchema: getInputSchema(CreateFieldArgsSchema),
        },
        {
          name: 'update_field',
          description: 'Update a field in a table',
          inputSchema: getInputSchema(UpdateFieldArgsSchema),
        },
        {
          name: 'delete_field',
          description: 'Delete a field in a table',
          inputSchema: getInputSchema(z.object({
            tableId: z.string(),
            fieldId: z.string(),
          })),
        },
        {
          name: 'create_record',
          description: 'Create a new record in a table',
          inputSchema: getInputSchema(CreateRecordArgsSchema),
        },
        {
          name: 'delete_record',
          description: 'Delete a record from a table',
          inputSchema: getInputSchema(z.object({
            tableId: z.string(),
            recordId: z.string(),
          })),
        },
        {
          name: 'update_record',
          description: 'Update an existing record in a table',
          inputSchema: getInputSchema(z.object({
            tableId: z.string(),
            recordId: z.string(),
            fields: z.record(z.any()),
          })),
        },
        {
          name: 'get_record',
          description: 'Get a single record by ID',
          inputSchema: getInputSchema(z.object({
            tableId: z.string(),
            recordId: z.string(),
          })),
        },
      ],
    };
  }

  private async handleCallTool(request: z.infer<typeof CallToolRequestSchema>): Promise<CallToolResult> {
    try {
      const sessionId = this.server.transport?.sessionId;
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      switch (request.params.name) {
        case 'list_tables': {
          const records = await this.airtableService.listTables(sessionId as string);
          return formatToolResponse(records);
        }
        case 'create_table': {
          const args = CreateTableArgsSchema.parse(request.params.arguments);
          const table = await this.airtableService.createTable(sessionId as string, args);
          return formatToolResponse(table);
        }
        case 'update_table': {
          const args = UpdateTableArgsSchema.parse(request.params.arguments);
          const table = await this.airtableService.updateTable(sessionId as string, args.tableId, args.name);
          return formatToolResponse(table);
        }
        case 'delete_table': {
          const args = z.object({
            tableId: z.string(),
          }).parse(request.params.arguments);
          const table = await this.airtableService.deleteTable(sessionId as string, args.tableId);
          return formatToolResponse(table);
        }
        case 'list_records': {
          const args = ListRecordsArgsSchema.parse(request.params.arguments);
          const records = await this.airtableService.listRecords(sessionId as string, args.tableId, (args as any).options);
          return formatToolResponse(records);
        }
        case 'list_fields': {
          const args = z.object({
            tableId: z.string(),
          }).parse(request.params.arguments);
          const fields = await this.airtableService.listFields(sessionId as string, args.tableId);
          return formatToolResponse(fields);
        }
        case 'create_field': {
          const args = CreateFieldArgsSchema.parse(request.params.arguments);
          const field = await this.airtableService.createField(sessionId as string, args.tableId, args.nested.field);
          return formatToolResponse(field);
        }
        case 'update_field': {
          const args = UpdateFieldArgsSchema.parse(request.params.arguments);
          const field = await this.airtableService.updateField(sessionId as string, args.tableId, args.fieldId, args.nested.field);
          return formatToolResponse(field);
        }
        case 'delete_field': {
          const args = z.object({
            tableId: z.string(),
            fieldId: z.string(),
          }).parse(request.params.arguments);
          const { success } = await this.airtableService.deleteField(sessionId as string, args.tableId, args.fieldId);
          return formatToolResponse({ success });
        }
        case 'create_record': {
          const args = CreateRecordArgsSchema.parse(request.params.arguments);
          const record = await this.airtableService.createRecord(sessionId as string, args.tableId, args.fields);
          return formatToolResponse(record);
        }
        case 'delete_record': {
          const args = z.object({
            tableId: z.string(),
            recordId: z.string(),
          }).parse(request.params.arguments);
          const { success } = await this.airtableService.deleteRecord(sessionId as string, args.tableId, args.recordId);
          return formatToolResponse({ success });
        }
        case 'update_record': {
          const args = z.object({
            tableId: z.string(),
            recordId: z.string(),
            fields: z.record(z.any()),
          }).parse(request.params.arguments);
          const record = await this.airtableService.updateRecord(sessionId as string, args.tableId, args.recordId, args.fields);
          return formatToolResponse({
            id: record.record_id,
            modifiedBy: record.last_modified_by?.name,
            modifiedTime: record.last_modified_time,
            fields: record.fields,
          });
        }
        case 'get_record': {
          const args = z.object({
            tableId: z.string(),
            recordId: z.string(),
          }).parse(request.params.arguments);
          const record = await this.airtableService.getRecord(sessionId as string, args.tableId, args.recordId);
          return formatToolResponse(record);
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
