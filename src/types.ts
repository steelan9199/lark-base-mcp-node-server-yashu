import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';

export const ResponseSchema = (dataSchema: z.ZodType<object>) => z.object({
  code: z.number(),
  data: dataSchema,
});

// Zod schemas for API responses
export const BaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionLevel: z.string(),
});

export const ListTablesResponseSchema = z.array(z.object({
  name: z.string().optional(),
  revision: z.number().optional(),
  table_id: z.string().optional(),
}));

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

export const FieldSchema = z.object({
  field_name: z.string(),
  type: z.number(),
  property: z.object({
    options: z.array(z.object({
      name: z.string().optional(),
      id: z.string().optional(),
      color: z.number().optional(),
    })).optional(),
    formatter: z.string().optional(),
    date_formatter: z.string().optional(),
    auto_fill: z.boolean().optional(),
    multiple: z.boolean().optional(),
    table_id: z.string().optional(),
    table_name: z.string().optional(),
    back_field_name: z.string().optional(),
    auto_serial: z.object({
      type: z.enum(['custom', 'auto_increment_number']),
      options: z.array(z.object({
        type: z.enum(['system_number', 'fixed_text', 'created_time']),
        value: z.string(),
      })).optional(),
    }).optional(),
    location: z.object({
      input_type: z.enum(['only_mobile', 'not_limit']),
    }).optional(),
    formula_expression: z.string().optional(),
    allowed_edit_modes: z.object({
      manual: z.boolean().optional(),
      scan: z.boolean().optional(),
    }).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    range_customize: z.boolean().optional(),
    currency_code: z.string().optional(),
    rating: z.object({
      symbol: z.string().optional(),
    }).optional(),
  }).optional(),
  description: z.string().optional(),
  is_primary: z.boolean().optional(),
  field_id: z.string().optional(),
  ui_type: z.enum([
    'Text', 'Barcode', 'Number', 'Progress', 'Currency', 'Rating',
    'SingleSelect', 'MultiSelect', 'DateTime', 'Checkbox', 'User',
    'GroupChat', 'Phone', 'Url', 'Attachment', 'SingleLink', 'Formula',
    'DuplexLink', 'Location', 'CreatedTime', 'ModifiedTime', 'CreatedUser',
    'ModifiedUser', 'AutoNumber',
  ]).optional(),
  is_hidden: z.boolean().optional(),
}).describe(
  'The config of a field. NB: Formula fields cannot be created with this MCP due to a limitation in the Airtable API.',
);

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

export const SearchRecordsArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  searchTerm: z.string().describe('Text to search for in records'),
  fieldIds: z
    .array(z.string())
    .optional()
    .describe('Specific field ids to search in. If not provided, searches all text-based fields.'),
  maxRecords: z.number().optional().describe('Maximum number of records to return. Defaults to 100.'),
});

export const TableDetailLevelSchema = z.enum(['tableIdentifiersOnly', 'identifiersOnly', 'full'])
  .describe(`Detail level for table information:
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
  fields: z.record(z.any()),
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
  baseId: z.string(),
  name: z.string().describe('Name for the new table. Must be unique in the base.'),
  description: z.string().optional(),
  fields: z.array(FieldSchema).describe(`Table fields. Rules:
- At least one field must be specified.
- The primary (first) field must be one of: single line text, long text, date, phone number, email, URL, number, currency, percent, duration, formula, autonumber, barcode.`),
});

export const UpdateTableArgsSchema = z.object({
  baseId: z.string(),
  tableId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
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
  baseId: z.string(),
  tableId: z.string(),
  fieldId: z.string(),
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
export type AirtableRecord = {
  fields: Record<string, string | number | number | number | boolean | {
    text?: string;
    link?: string;
  } | {
    location?: string;
    pname?: string;
    cityname?: string;
    adname?: string;
    address?: string;
    name?: string;
    full_address?: string;
  } | Array<{
    id?: string;
    name?: string;
    avatar_url?: string;
  }> | Array<string> | Array<{
    id?: string;
    name?: string;
    en_name?: string;
    email?: string;
    avatar_url?: string;
  }> | Array<{
    file_token?: string;
    name?: string;
    type?: string;
    size?: number;
    url?: string;
    tmp_url?: string;
  }>>;
  record_id?: string | undefined;
  created_by?: {
    id?: string | undefined;
    name?: string | undefined;
    en_name?: string | undefined;
    email?: string | undefined;
    avatar_url?: string | undefined;
  } | undefined;
  created_time?: number | undefined;
  last_modified_by?: {
    id?: string | undefined;
    name?: string | undefined;
    en_name?: string | undefined;
    email?: string | undefined;
    avatar_url?: string | undefined;
  } | undefined;
  last_modified_time?: number | undefined;
};

export type TCreateRecordArgs = z.infer<typeof CreateRecordArgsSchema>['fields'];

export interface ListRecordsOptions {
  maxRecords?: number | undefined;
  filterByFormula?: string | undefined;
}

export interface IBaseService {
  listRecords(tableId: string, options?: ListRecordsOptions): Promise<AirtableRecord[]>;
  listTables(): Promise<{
    tables: ListTablesResponse,
    baseToken: string,
  }>;
  listFields(tableId: string): Promise<Field[]>;
  createRecord(tableId: string, fields: TCreateRecordArgs): Promise<AirtableRecord>;
}

export interface IAirtableMCPServer {
  connect(transport: Transport): Promise<void>;
}

export enum FieldType {
  NotSupport = 0,
  Text = 1,
  Number = 2,
  SingleSelect = 3,
  MultiSelect = 4,
  DateTime = 5,
  // 暂未实现
  // SingleLine = 6,
  Checkbox = 7,
  // Percent = 8,
  // Duration = 9,
  // Rating = 10,
  User = 11,
  // Tag = 12,
  Phone = 13,
  // Email = 14,
  Url = 15,
  // Picture = 16,
  Attachment = 17,
  SingleLink = 18,
  Lookup = 19,
  Formula = 20,
  // 双向关联
  DuplexLink = 21,
  // 地理位置
  Location = 22,
  // 群组
  GroupChat = 23,
  // 阶段
  Stage = 24,
  // Object 字段
  Object = 25,
  // 高级权限下不可见的列
  Denied = 403,

  /**
   * 引用类型字段，前后端约定用10xx公共前缀开头
   */
  CreatedTime = 1001,
  ModifiedTime = 1002,
  CreatedUser = 1003,
  ModifiedUser = 1004,
  // 自动编号
  AutoNumber = 1005,
  // 按钮字段
  VirtualTrigger = 3001, // 仅含 meta，不含 cellValue 的字段
}
