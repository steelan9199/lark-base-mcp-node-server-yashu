import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';
import { CreateRecordFieldsSchema } from './createRecordFieldTypes.js';
import { FieldSchema } from './fieldSchemas.js';
export const ResponseSchema = (dataSchema: z.ZodType<object>) =>
  z.object({
    code: z.number(),
    data: dataSchema,
  });

// Zod schemas for API responses
export const BaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionLevel: z.string(),
});

export const ListTablesResponseSchema = z.array(
  z.object({
    name: z.string().optional(),
    revision: z.number().optional(),
    table_id: z.string().optional(),
  }),
);

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

// export const FieldSchema = z
//   .object({
//     field_name: z.string(),
//     type: z.number().describe(`
//     type使用FieldType枚举值, 相同类型用ui_type区分
//     enum FieldType {
//       NotSupport = 0,
//       Text = 1, // 文本（默认值）、条码（需声明 "ui_type": "Barcode"）、邮箱（需声明"ui_type": "Email")
//       Number = 2, // 数字（默认值）、进度（需声明 "ui_type": "Progress"）、货币（需声明 "ui_type": "Currency"）、评分（需声明 "ui_type": "Rating"
//       SingleSelect = 3,
//       MultiSelect = 4,
//       DateTime = 5,
//       Checkbox = 7,
//       User = 11,
//       Phone = 13,
//       Url = 15,
//       Attachment = 17,
//       SingleLink = 18,
//       Lookup = 19,
//       Formula = 20,
//       // 双向关联
//       DuplexLink = 21,
//       // 地理位置
//       Location = 22,
//       // 群组
//       GroupChat = 23,
//       // 阶段
//       Stage = 24,
//       // Object 字段
//       Object = 25,
//       // 高级权限下不可见的列
//       Denied = 403,

//       /**
//        * 引用类型字段，前后端约定用10xx公共前缀开头
//        */
//       CreatedTime = 1001,
//       ModifiedTime = 1002,
//       CreatedUser = 1003,
//       ModifiedUser = 1004,
//       // 自动编号
//       AutoNumber = 1005,
//       // 按钮字段
//       VirtualTrigger = 3001, // 仅含 meta，不含 cellValue 的字段
//     }  
//   `),
//     property: z
//       .object({
//         options: z
//           .array(
//             z.object({
//               name: z.string().optional(),
//               id: z.string().optional(),
//               color: z.number().optional(),
//             }),
//           )
//           .optional(),
//         formatter: z.string().optional(),
//         date_formatter: z.string().optional(),
//         auto_fill: z.boolean().optional(),
//         multiple: z.boolean().optional(),
//         table_id: z.string().optional(),
//         table_name: z.string().optional(),
//         back_field_name: z.string().optional(),
//         auto_serial: z
//           .object({
//             type: z.enum(['custom', 'auto_increment_number']),
//             options: z
//               .array(
//                 z.object({
//                   type: z.enum(['system_number', 'fixed_text', 'created_time']),
//                   value: z.string(),
//                 }),
//               )
//               .optional(),
//           })
//           .optional(),
//         location: z
//           .object({
//             input_type: z.enum(['only_mobile', 'not_limit']),
//           })
//           .optional(),
//         formula_expression: z.string().optional(),
//         allowed_edit_modes: z
//           .object({
//             manual: z.boolean().optional(),
//             scan: z.boolean().optional(),
//           })
//           .optional(),
//         min: z.number().optional(),
//         max: z.number().optional(),
//         range_customize: z.boolean().optional(),
//         currency_code: z.string().optional(),
//         rating: z
//           .object({
//             symbol: z.string().optional(),
//           })
//           .optional(),
//       })
//       .optional(),
//     description: z.string().optional(),
//     is_primary: z.boolean().optional(),
//     field_id: z.string().optional(),
//     ui_type: z
//       .enum([
//         'Text',
//         'Email',
//         'Barcode',
//         'Number',
//         'Progress',
//         'Currency',
//         'Rating',
//         'SingleSelect',
//         'MultiSelect',
//         'DateTime',
//         'Checkbox',
//         'User',
//         'GroupChat',
//         'Phone',
//         'Url',
//         'Attachment',
//         'SingleLink',
//         'Formula',
//         'Lookup',
//         'DuplexLink',
//         'Location',
//         'CreatedTime',
//         'ModifiedTime',
//         'CreatedUser',
//         'ModifiedUser',
//         'AutoNumber',
//         'Button',
//       ])
//       .optional(),
//     is_hidden: z.boolean().optional(),
//   })
//   .describe('The config of a field. NB: Formula fields cannot be created with this MCP due to a limitation in the base API.');

export const ViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

export const TableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  primaryFieldId: z.string(),
  fields: z.array(FieldSchema.and(z.object({ id: z.string() }))),
  views: z.array(ViewSchema),
});

// 表格Schema
export const CreateTableSchema = z.object({
  name: z.string().optional(),
  default_view_name: z.string().optional(),
  fields: z.array(FieldSchema).optional(),
});

// 类型导出
export type CreateTable = z.infer<typeof CreateTableSchema>;

export const BaseSchemaResponseSchema = z.object({
  tables: z.array(TableSchema),
});

// Zod schemas for tool arguments
export const ListRecordsArgsSchema = z.object({
  tableId: z.string(),
});

export const GetAppTokenArgsSchema = z.object({
  wikiToken: z.string(),
});

export const GetTableSchemaArgsSchema = z.object({
  tableId: z.string(),
});

export const SearchRecordsArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  searchTerm: z.string().describe('Text to search for in records'),
  fieldIds: z.array(z.string()).optional().describe('Specific field ids to search in. If not provided, searches all text-based fields.'),
  maxRecords: z.number().optional().describe('Maximum number of records to return. Defaults to 100.'),
});

export const TableDetailLevelSchema = z.enum(['tableIdentifiersOnly', 'identifiersOnly', 'full']).describe(`Detail level for table information:
- tableIdentifiersOnly: table IDs and names
- identifiersOnly: table, field, and view IDs and names
- full: complete details including field types, descriptions, and configurations

Note for LLMs: To optimize context window usage, request the minimum detail level needed:
- Use 'tableIdentifiersOnly' when you only need to list or reference tables
- Use 'identifiersOnly' when you need to work with field or view references
- Only use 'full' when you need field types, descriptions, or other detailed configuration

If you only need detailed information on a few tables in a base with many complex tables, it might be more efficient for you to use list_tables with tableIdentifiersOnly, then describe_table with full on the specific tables you want.`);

export const DescribeTableArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  detailLevel: TableDetailLevelSchema.optional().default('full'),
});

export const ListTablesArgsSchema = z.object({
  // baseId: z.string(),
  // detailLevel: TableDetailLevelSchema.optional().default('full'),
});

export const GetRecordArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  recordId: z.string(),
});

export const CreateRecordArgsSchema = z.object({
  tableId: z.string(),
  fields: CreateRecordFieldsSchema,
});

export const UpdateRecordsArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  records: z.array(
    z.object({
      id: z.string(),
      fields: z.record(z.any()),
    }),
  ),
});

export const DeleteRecordsArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  recordIds: z.array(z.string()),
});

export const CreateTableArgsSchema = z.object({
  // baseId: z.string(),
  name: z.string().describe('Name for the new table. Must be unique in the base.'),
  // description: z.string().optional(),
  fields: z.array(FieldSchema).describe(`Table fields. Rules:
- At least one field must be specified.
- The primary (first) field must be one of: single line text, long text, date, phone number, email, URL, number, currency, percent, duration, formula, autonumber, barcode.
`),
});

export const UpdateTableArgsSchema = z.object({
  // baseId: z.string(),
  tableId: z.string(),
  name: z.string(),
  // description: z.string().optional(),
});

export const CreateFieldArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  // This is used as a workaround for https://github.com/orgs/modelcontextprotocol/discussions/90
  nested: z.object({
    field: FieldSchema,
  }),
});

export const UpdateFieldArgsSchema = z.object({
  // baseId: z.string(),
  tableId: z.string(),
  fieldId: z.string(),
  nested: z.object({
    field: FieldSchema,
  }),
  name: z.string().optional(),
  description: z.string().optional(),
});

export type ListTablesResponse = z.infer<typeof ListTablesResponseSchema>;
export type BaseSchemaResponse = z.infer<typeof BaseSchemaResponseSchema>;
export type Base = z.infer<typeof BaseSchema>;
export type Table = z.infer<typeof TableSchema>;
export type Field = z.infer<typeof FieldSchema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldSet = Record<string, any>;
export type BaseRecord = {
  fields: Record<
    string,
    | string
    | number
    | number
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

export type TCreateRecordArgs = z.infer<typeof CreateRecordArgsSchema>['fields'];

export interface ListRecordsOptions {
  maxRecords?: number | undefined;
  filterByFormula?: string | undefined;
}

export interface BaseServiceResponse {
  success: boolean;
}

export interface IBaseService {
  listRecords(sessionId: string, tableId: string, options?: ListRecordsOptions): Promise<BaseRecord[]>;
  listTables(sessionId?: string): Promise<{
    tables: ListTablesResponse;
    baseToken: string;
  }>;
  createTable(sessionId: string, data: CreateTable): Promise<CreateTableResponse>;
  updateTable(sessionId: string, tableId: string, name: string): Promise<{ name?: string }>;
  deleteTable(sessionId: string, tableId: string): Promise<BaseServiceResponse>;
  listFields(sessionId: string, tableId: string): Promise<Field[]>;
  createField(sessionId: string, tableId: string, field: Field): Promise<Field | undefined>;
  updateField(sessionId: string, tableId: string, fieldId: string, field: Field): Promise<Field | undefined>;
  deleteField(sessionId: string, tableId: string, fieldId: string): Promise<BaseServiceResponse>;
  createRecord(sessionId: string, tableId: string, fields: TCreateRecordArgs): Promise<BaseRecord>;
  updateRecord(sessionId: string, tableId: string, recordId: string, fields: TCreateRecordArgs): Promise<BaseRecord>;
  deleteRecord(sessionId: string, tableId: string, recordId: string): Promise<BaseServiceResponse>;
  getRecord(sessionId: string, tableId: string, recordId: string): Promise<BaseRecord | null>;
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

export const CreateTableResponseSchema = z.object({
  table_id: z.string().optional(),
  default_view_id: z.string().optional(),
  field_id_list: z.array(z.string()).optional(),
});

export type CreateTableResponse = z.infer<typeof CreateTableResponseSchema>;
