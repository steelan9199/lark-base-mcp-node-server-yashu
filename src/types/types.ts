import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';
import { RecordFieldsSchema } from './fieldValueSchemas.js';
import { FieldSchema } from './fieldSchemas.js';

// ========== Base Response Schemas ==========
export const ResponseSchema = (dataSchema: z.ZodType<object>) =>
  z.object({
    code: z.number(),
    data: dataSchema,
  });

export const BaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionLevel: z.string(),
});

// ========== View Related Schemas ==========
export const ViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

// ========== Table Related Schemas ==========
export const TableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  primaryFieldId: z.string(),
  fields: z.array(FieldSchema.and(z.object({ id: z.string() }))),
  views: z.array(ViewSchema),
});

export const GetAppTokenArgsSchema = z.object({
  url: z.string(),
  user_access_token: z.string(),
});

export const BaseSchemaResponseSchema = z.object({
  tables: z.array(TableSchema),
});

export const CommonTableArgsSchema = z.object({
  table_id: z.string(),
  app_token: z.string(),
  user_access_token: z.string(),  
});

export const CreateTableArgsSchema = z.object({
  table: z.object({
    name: z.string().optional(),
    fields: z.array(FieldSchema).optional().describe(`Table fields. Rules:
      - At least one field must be specified.
      - The primary (first) field must be one of: single line text, long text, date, phone number, email, URL, number, currency, percent, duration, formula, autonumber, barcode.
      `),
  }),
  user_access_token: z.string(),
  app_token: z.string(),
});

export const CreateTableResponseSchema = z.object({
  table_id: z.string().optional(),
  default_view_id: z.string().optional(),
  field_id_list: z.array(z.string()).optional(),
});

export const ListTablesResponseSchema = z.array(
  z.object({
    name: z.string().optional(),
    revision: z.number().optional(),
    table_id: z.string().optional(),
  }),
);

// ========== Field Related Schemas ==========
export const FieldOptionsSchema = z
  .object({
    isReversed: z.boolean().optional(),
    inverseLinkFieldId: z.string().optional(),
    linkedTableId: z.string().optional(),
    prefersSingleRecordLink: z.boolean().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  })
  .passthrough();

// ========== API Argument Schemas ==========
export const ListRecordsArgsSchema = z.object({
  table_id: z.string(),
  app_token: z.string(),
  user_access_token: z.string(),
  field_names: z.string().optional().describe('Use name rather than id to specify the fields to return.It needs to be formatted as a JSON array string'),
  sort: z.array(z.string()).optional(),
  filter: z.string().optional().describe('eg. AND(CurrentValue.[订单号].contains("004"),CurrentValue.[订单日期]= TODAY())'),
  recordLength: z.number().optional().default(20),
});

export const ListTablesArgsSchema = z.object({
  app_token: z.string(),
  user_access_token: z.string(),
  length: z.number().optional(),
});

export const GetTableSchemaArgsSchema = z.object({
  table_id: z.string(),
});

export const SearchRecordsArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  searchTerm: z.string().describe('Text to search for in records'),
  fieldIds: z.array(z.string()).optional().describe('Specific field ids to search in. If not provided, searches all text-based fields.'),
  maxRecords: z.number().optional().describe('Maximum number of records to return. Defaults to 100.'),
});

export const RecordArgsSchema = z.object({
  app_token: z.string(),
  table_id: z.string(),
  record_id: z.string(),
  user_access_token: z.string(),
});

export const CreateRecordArgsSchema = CommonTableArgsSchema.extend({
  fields: RecordFieldsSchema,
  user_access_token: z.string(),
});

export const CreateBatchRecordArgsSchema = z.object({
  path: CommonTableArgsSchema,
  records: z.array(z.object({
    fields: RecordFieldsSchema,
  })),
  user_access_token: z.string(),
});
export const UpdateRecordArgsSchema = z.object({
  path: RecordArgsSchema,
  fields: RecordFieldsSchema,
  user_access_token: z.string(),
});

// export const DeleteRecordsArgsSchema = z.object({
//   baseId: z.string(),
//   tableId: z.string(),
//   recordIds: z.array(z.string()),
// });

// export const CreateTableArgsSchema = z.object({
//   name: z.string().describe('Name for the new table. Must be unique in the base.'),
//   fields: z.array(FieldSchema).describe(`Table fields. Rules:
// - At least one field must be specified.
// - The primary (first) field must be one of: single line text, long text, date, phone number, email, URL, number, currency, percent, duration, formula, autonumber, barcode.
// `),
// });

export const UpdateTableArgsSchema = z.object({
  name: z.string(),
  path: CommonTableArgsSchema,
  user_access_token: z.string(),
});

export const CreateFieldArgsSchema = z.object({
  path: CommonTableArgsSchema,
  data: FieldSchema,
  user_access_token: z.string(),
});

export const CreateBaseArgsSchema = z.object({
  user_access_token: z.string().describe('User access token for base tools calling'),
  name: z.string(),
  folder_token: z.string().optional().describe('Folder token where the base will be created'),
});

export const UpdateBaseArgsSchema = z.object({
  app_token: z.string(),
  name: z.string().optional(),
  folder_token: z.string().optional().describe('New folder token for the base'),
  user_access_token: z.string(),
});

export const GetBaseArgsSchema = z.object({
  app_token: z.string().describe('ID of the base to get'),
  user_access_token: z.string(),
});

export const CopyBaseArgsSchema = z.object({
  app_token: z.string(),
  folder_token: z.string().optional(),
  user_access_token: z.string(),
});

export const ListFieldsArgsSchema = z.object({
  length: z.number().optional(),
  path: CommonTableArgsSchema,
  user_access_token: z.string(),
});

export const CommonFieldArgsSchema = CommonTableArgsSchema.extend({
  field_id: z.string(),
  user_access_token: z.string(),
});

export const UpdateFieldArgsSchema = z.object({
  data: FieldSchema,
  path: CommonFieldArgsSchema,
  user_access_token: z.string(),
});

// ========== Type Definitions ==========
export type ListTablesResponse = z.infer<typeof ListTablesResponseSchema>;
export type BaseSchemaResponse = z.infer<typeof BaseSchemaResponseSchema>;
export type Base = z.infer<typeof BaseSchema>;
export type Table = z.infer<typeof TableSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type GetAppTokenArgs = z.infer<typeof GetAppTokenArgsSchema>;
export type ListRecordsArgs = z.infer<typeof ListRecordsArgsSchema>;
export type ListTablesArgs = z.infer<typeof ListTablesArgsSchema>;
export type RecordArgs = z.infer<typeof RecordArgsSchema>;
export type CreateTableArgs = z.infer<typeof CreateTableArgsSchema>;
export type CreateTableResponse = z.infer<typeof CreateTableResponseSchema>;
export type UpdateTableArgs = z.infer<typeof UpdateTableArgsSchema>;
export type UpdateFieldArgs = z.infer<typeof UpdateFieldArgsSchema>;
export type CommonTableArgs = z.infer<typeof CommonTableArgsSchema>;
export type CreateBaseArgs = z.infer<typeof CreateBaseArgsSchema>;
export type UpdateBaseArgs = z.infer<typeof UpdateBaseArgsSchema>;
export type GetBaseArgs = z.infer<typeof GetBaseArgsSchema>;
export type CopyBaseArgs = z.infer<typeof CopyBaseArgsSchema>;
export type CreateRecordArgs = z.infer<typeof CreateRecordArgsSchema>;
export type UpdateRecordArgs = z.infer<typeof UpdateRecordArgsSchema>;
export type CreateBatchRecordArgs = z.infer<typeof CreateBatchRecordArgsSchema>;
// export type DeleteRecordsArgs = z.infer<typeof DeleteRecordsArgsSchema>;
// export type GetRecordArgs = z.infer<typeof RecordArgsSchema>;
export type CreateFieldArgs = z.infer<typeof CreateFieldArgsSchema>;
export type CommonFieldArgs = z.infer<typeof CommonFieldArgsSchema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldSet = Record<string, any>;

export type BaseRecord = {
  fields: Record<
    string,
    | string
    | number
    | boolean
    | {
        text?: string;
        link?: string;
      }
    | {
        location?: string;
        pname?: string;
        cityname?: string;
        adname?: string;
        address?: string;
        name?: string;
        full_address?: string;
      }
    | Array<{
        id?: string;
        name?: string;
        avatar_url?: string;
      }>
    | Array<string>
    | Array<{
        id?: string;
        name?: string;
        en_name?: string;
        email?: string;
        avatar_url?: string;
      }>
    | Array<{
        file_token?: string;
        name?: string;
        type?: string;
        size?: number;
        url?: string;
        tmp_url?: string;
      }>
  >;
  record_id?: string | undefined;
  created_by?:
    | {
        id?: string | undefined;
        name?: string | undefined;
        en_name?: string | undefined;
        email?: string | undefined;
        avatar_url?: string | undefined;
      }
    | undefined;
  created_time?: number | undefined;
  last_modified_by?:
    | {
        id?: string | undefined;
        name?: string | undefined;
        en_name?: string | undefined;
        email?: string | undefined;
        avatar_url?: string | undefined;
      }
    | undefined;
  last_modified_time?: number | undefined;
};

export interface BaseServiceResponse {
  success: boolean;
}

export interface IBaseService {
  getAuthUrl(sessionId?: string): Promise<any>;
  getAuthToken(sessionId?: string): Promise<any>;
  getAppToken(getAppTokenArgs: GetAppTokenArgs, sessionId?: string): Promise<any>;
  createBase(createBaseArgs: CreateBaseArgs, sessionId?: string): Promise<any>;
  updateBase(updateBaseArgs: UpdateBaseArgs, sessionId?: string): Promise<any>;
  copyBase(copyBaseArgs: CopyBaseArgs, sessionId?: string): Promise<any>;
  getBase(getBaseArgs: GetBaseArgs, sessionId?: string): Promise<any>;
  listRecords(listRecordsArgs: ListRecordsArgs, sessionId?: string): Promise<BaseRecord[]>;
  listTables(listTablesArgs: ListTablesArgs, sessionId?: string): Promise<{
    tables: ListTablesResponse;
    baseToken: string;
  }>;
  createTable(data: CreateTableArgs, sessionId?: string): Promise<CreateTableResponse>;
  updateTable(updateTableArgs: UpdateTableArgs, sessionId?: string): Promise<{ name?: string }>;
  deleteTable(deleteTableArgs: CommonTableArgs, sessionId?: string): Promise<BaseServiceResponse>;
  listFields(listFieldsArgs: ListFieldsArgs, sessionId?: string): Promise<Field[]>;
  createField(createFieldArgs: CreateFieldArgs, sessionId?: string): Promise<Field | undefined>;
  updateField(updateFieldArgs: UpdateFieldArgs, sessionId?: string): Promise<Field | undefined>;
  deleteField(deleteFieldArgs: CommonFieldArgs, sessionId?: string): Promise<BaseServiceResponse>;
  createRecord(createRecordArgs: CreateRecordArgs, sessionId?: string): Promise<BaseRecord>;
  updateRecord(updateRecordArgs: UpdateRecordArgs, sessionId?: string): Promise<BaseRecord>;
  deleteRecord(deleteRecordArgs: RecordArgs, sessionId?: string): Promise<BaseServiceResponse>;
  getRecord(getRecordArgs: RecordArgs, sessionId?: string): Promise<BaseRecord | null>;
  createBatchRecord(createBatchRecordArgs: CreateBatchRecordArgs, sessionId?: string): Promise<BaseRecord[]>;
}

export interface IBaseMCPServer {
  connect(transport: Transport): Promise<void>;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description: string | undefined;
  tags: string[] | undefined;
  createdAt: number;
  updatedAt: number;
  version: number | undefined;
  isEnabled: boolean | undefined;
  category: string | undefined;
  parameters: PromptParameter[] | undefined;
}

export interface PromptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string | undefined;
  required: boolean | undefined;
  defaultValue: any | undefined;
}

export interface CreatePromptRequest {
  name: string;
  content: string;
  description?: string;
  tags?: string[];
  category?: string;
  parameters?: PromptParameter[];
}

export interface UpdatePromptRequest {
  name?: string;
  content?: string;
  description?: string;
  tags?: string[];
  isEnabled?: boolean;
  category?: string;
  parameters?: PromptParameter[];
}

export interface TextResourceArgument {
  name: string;
  description: string | undefined;
  required: boolean | undefined;
}

export interface TextResource {
  id: string;
  name: string;
  description: string | undefined;
  arguments: TextResourceArgument[] | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTextResourceRequest {
  name: string;
  description?: string;
  arguments?: TextResourceArgument[];
}

export interface UpdateTextResourceRequest {
  name?: string;
  description?: string;
  arguments?: TextResourceArgument[];
}

// export type ListFieldsParams = z.infer<typeof ListFieldsParamsSchema>;
export type ListFieldsArgs = z.infer<typeof ListFieldsArgsSchema>;
