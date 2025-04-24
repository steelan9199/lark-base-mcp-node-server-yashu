/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
import { BaseClient } from '@lark-base-open/node-sdk';
import {
  IBaseService,
  BaseRecord,
  TCreateRecordArgs,
  FieldSet,
  Field,
  ListTablesResponse,
  ListRecordsOptions,
  Table,
  CreateTable,
  CreateTableResponse,
} from '../types/types.js';
import { FieldType } from '../types/enums.js';
import { sessionManager } from './sessionManager.js';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { FieldSchema } from '../types/fieldSchemas.js';

const maxDataNumber = 100;

const optionHandler = (value: any, options: any[]) => {
  const optVal = value?.toString?.() ?? value ?? null;
  const option = options?.find((opt) => opt.id === optVal);
  return option ? option.name : optVal;
};

const transformFieldValue = (value: any, fieldMeta: Field) => {
  switch (fieldMeta.type) {
    case FieldType.Text:
    case FieldType.Phone:
      return value?.toString() ?? value ?? null;
    case FieldType.Number:
      const val = Number(value);
      return Number.isNaN(val) ? null : val;
    case FieldType.SingleSelect:
    case FieldType.Stage:
      // SingleLink 错误传值会报错，且目前传数组、文本、ID都未填充至表格
      // Stage传值未填充到表格中

      return optionHandler(value, fieldMeta.property?.options || []);
    case FieldType.SingleLink:
    case FieldType.DuplexLink:
      if (typeof value === 'string') {
        return [value];
      }
      if (Array.isArray(value)) {
        return value.map((v) => v?.toString?.() ?? '');
      }
      return [value?.toString?.()];
    case FieldType.MultiSelect:
      if (Array.isArray(value)) {
        return value.map((v) => optionHandler(v, fieldMeta.property?.options || []));
      }
      return optionHandler(value, fieldMeta.property?.options || []);
    case FieldType.DateTime:
      const dateVal = new Date(value).getTime();
      return Number.isNaN(dateVal) || dateVal === 0 ? null : dateVal;
    case FieldType.Checkbox:
      return value?.toString() === 'true' || false;
    case FieldType.Url:
      const urlVal = value?.toString?.() ?? value ?? null;
      return {
        link: urlVal,
        text: urlVal,
      };
    default:
      return null;
  }
};

const logToFile = (...args: any[]) => {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  const logMessage = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');

  const logEntry = `[${timestamp}] ${logMessage}\n`;
  const logFile = path.join(logDir, `base-service-${format(new Date(), 'yyyy-MM-dd')}.log`);

  fs.appendFileSync(logFile, logEntry);
  console.log(...args); // Also log to console for immediate feedback
};

export class BaseService implements IBaseService {
  serviceType: 'sse' | 'stdio' = 'sse';
  _personalBaseToken: string | undefined;
  _appToken: string | undefined;
  _client: BaseClient | undefined;
  constructor(options?: { transport: 'sse' | 'stdio'; personalBaseToken: string; appToken: string }) {
    this.serviceType = options?.transport || 'sse';
    if (this.serviceType === 'stdio' && options) {
      this._personalBaseToken = options.personalBaseToken || process.env.PERSONAL_BASE_TOKEN;
      this._appToken = options.appToken || process.env.APP_TOKEN;
      if (!this._personalBaseToken || !this._appToken) {
        throw new Error('personalBaseToken and appToken must be set');
      }
      this._client = new BaseClient({
        appToken: this._appToken,
        personalBaseToken: this._personalBaseToken,
      });
    }
  }

  private getClient(sessionId?: string): BaseClient {
    // logToFile('getClient', !!this._client, this.serviceType);
    if (this._client) {
      return this._client!;
    }

    // sse 模式下，每次调用tools都创建一个client
    const session = sessionManager.getSession(sessionId!);
    if (!session) {
      throw new Error('Session not found');
    }

    return new BaseClient({
      appToken: session.appToken,
      personalBaseToken: session.personalBaseToken,
    });
  }

  async listRecords(sessionId: string, table_id: string, options?: ListRecordsOptions): Promise<BaseRecord[]> {
    const client = this.getClient(sessionId);
    const params: any = {
      page_size: options?.maxRecords || 10,
    };

    if (options?.filterByFormula) {
      params.filter = options.filterByFormula;
    }

    const data = await client.base.appTableRecord.list({
      path: {
        table_id,
      },
      params,
    });

    if (data.code != 0) {
      throw new Error(`Failed to list records: ${data.msg}`);
    }

    return data.data?.items ?? [];
  }

  async listTables(sessionId?: string) {
    const client = this.getClient(sessionId);
    const tables = [];

    for await (const item of await client.base.appTable.listWithIterator({
      params: {
        page_size: 20,
      },
    })) {
      if (item?.items) {
        tables.push(...item.items);
      }
      if (tables.length >= maxDataNumber) {
        break;
      }
    }

    const session = sessionManager.getSession(sessionId!);

    return {
      tables,
      baseToken: this._appToken || session?.appToken || 'undefined',
    };
  }

  async deleteTable(sessionId: string, tableId: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTable.delete({
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to delete table: ${msg}`);
    }

    return { success: true };
  }

  async updateTable(sessionId: string, tableId: string, name: string): Promise<{ name?: string }> {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTable.patch({
      data: {
        name,
      },
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to update table: ${msg}`);
    }

    return data?.name ? { name: data?.name } : {};
  }

  async listFields(sessionId: string, table_id: string): Promise<Field[]> {
    const client = this.getClient(sessionId);
    const fields = [];
    for await (const item of await client.base.appTableField.listWithIterator({
      params: {
        page_size: 20,
      },
      path: {
        table_id,
      },
    })) {
      if (item?.items) {
        fields.push(...item.items);
      }
      if (fields.length >= maxDataNumber) {
        break;
      }
    }
    return fields.map(field => ({
      ...field,
      description: typeof field.description === 'string' ? { text: field.description } : field.description
    }));
  }

  async createField(sessionId: string, tableId: string, field: Field) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTableField.create({
      data: field,
      // {
      //   field_name: field.field_name,
      //   type: field.type,
      //   property: field.property,
      //   description: typeof field.description === 'string' ? { text: field.description } : undefined,
      //   //@ts-expect-error
      //   // sdk 目前枚举值类型没对齐开放平台，先忽略
      //   ui_type: field.ui_type,
      // },
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to create field: ${msg}`);
    }

    return data?.field;

    // return {
    //   field_name: data?.field?.field_name || '',
    //   type: data?.field?.type || 0,
    //   property: data?.field?.property,
    //   description: data?.field?.description?.text || '',
    //   ui_type: data?.field?.ui_type,
    //   is_primary: data?.field?.is_primary,
    //   field_id: data?.field?.field_id,
    // };
  }

  async deleteField(sessionId: string, tableId: string, fieldId: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTableField.delete({
      path: {
        table_id: tableId,
        field_id: fieldId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to delete field: ${msg}`);
    }

    return { success: true };
  }

  async updateField(sessionId: string, tableId: string, fieldId: string, field: Field) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTableField.update({
      data: field,
      // data: {
      //   field_name: field.field_name,
      //   type: field.type,
      //   property: field.property,
      //   description: field.description ? { text: field.description } : undefined,
      //   //@ts-expect-error
      //   // sdk 目前枚举值类型没对齐开放平台，先忽略
      //   ui_type: field.ui_type,
      // },
      path: {
        table_id: tableId,
        field_id: fieldId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to update field: ${msg}`);
    }

    return data?.field;

    // return {
    //   field_name: data?.field?.field_name || '',
    //   type: data?.field?.type || 0,
    //   property: data?.field?.property,
    //   description: data?.field?.description?.text || '',
    //   ui_type: data?.field?.ui_type,
    //   is_primary: data?.field?.is_primary,
    //   field_id: data?.field?.field_id,
    // };
  }

  async createRecord(sessionId: string, tableId: string, fields: TCreateRecordArgs) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTableRecord.create({
      data: {
        fields,
      },
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to create record: ${msg}`);
    }

    return data?.record || { fields: {} };
  }

  async updateRecord(sessionId: string, tableId: string, recordId: string, fields: TCreateRecordArgs) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTableRecord.update({
      data: {
        fields,
      },
      path: {
        table_id: tableId,
        record_id: recordId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to update record: ${msg}`);
    }

    return data?.record || { fields: {} };
  }

  async deleteRecord(sessionId: string, tableId: string, recordId: string) {
    const client = this.getClient(sessionId);
    const { code, msg, data } = await client.base.appTableRecord.delete({
      path: {
        table_id: tableId,
        record_id: recordId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to delete record: ${msg}`);
    }

    return { success: true };
  }

  async getRecord(sessionId: string, tableId: string, recordId: string): Promise<BaseRecord | null> {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.base.appTableRecord.get({
      path: {
        table_id: tableId,
        record_id: recordId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to get record: ${msg}`);
    }

    return data?.record || null;
  }

  async createTable(sessionId: string, data: CreateTable): Promise<CreateTableResponse> {
    const client = this.getClient(sessionId);
    const {
      data: response,
      code,
      msg,
    } = await client.base.appTable.create({
      data: {
        table: {
          name: data.name,
          default_view_name: data.default_view_name,
          // sdk 目前枚举值类型没对齐开放平台，先忽略
          fields: data.fields?.map((field) => ({
            field_name: field.field_name,
            type: field.type,
            ui_type: field.ui_type,
            property: field.property,
            description: typeof field.description === 'string' ? { text: field.description } : field.description,
          })),
        },
      },
    });

    if (code != 0 || !response?.table_id || !response.field_id_list?.length) {
      throw new Error(`Failed to create table: ${msg}`);
    }
    return response;
  }

  // private async validateAndGetSearchFields(
  //   baseId: string,
  //   tableId: string,
  //   requestedFieldIds?: string[],
  // ): Promise<string[]> {
  //   const schema = await this.getBaseSchema(baseId);
  //   const table = schema.tables.find((t) => t.id === tableId);
  //   if (!table) {
  //     throw new Error(`Table ${tableId} not found in base ${baseId}`);
  //   }

  //   const searchableFieldTypes = [
  //     'singleLineText',
  //     'multilineText',
  //     'richText',
  //     'email',
  //     'url',
  //     'phoneNumber',
  //   ];

  //   const searchableFields = table.fields
  //     .filter((field) => searchableFieldTypes.includes(field.type))
  //     .map((field) => field.id);

  //   if (searchableFields.length === 0) {
  //     throw new Error('No text fields available to search');
  //   }

  //   // If specific fields were requested, validate they exist and are text fields
  //   if (requestedFieldIds && requestedFieldIds.length > 0) {
  //     // Check if any requested fields were invalid
  //     const invalidFields = requestedFieldIds.filter((fieldId) => !searchableFields.includes(fieldId));
  //     if (invalidFields.length > 0) {
  //       throw new Error(`Invalid fields requested: ${invalidFields.join(', ')}`);
  //     }

  //     return requestedFieldIds;
  //   }

  //   return searchableFields;
  // }

  // async searchRecords(
  //   baseId: string,
  //   tableId: string,
  //   searchTerm: string,
  //   fieldIds?: string[],
  //   maxRecords?: number,
  // ): Promise<BaseRecord[]> {
  //   // Validate and get search fields
  //   const searchFields = await this.validateAndGetSearchFields(baseId, tableId, fieldIds);

  //   // Escape the search term to prevent formula injection
  //   const escapedTerm = searchTerm.replace(/["\\]/g, '\\$&');

  //   // Build OR(FIND("term", field1), FIND("term", field2), ...)
  //   const filterByFormula = `OR(${
  //     searchFields
  //       .map((fieldId) => `FIND("${escapedTerm}", {${fieldId}})`)
  //       .join(',')
  //   })`;

  //   return this.listRecords(baseId, tableId, { maxRecords, filterByFormula });
  // }
}
