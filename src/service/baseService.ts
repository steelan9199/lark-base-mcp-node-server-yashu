/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
import { AppType, BaseClient } from '@lark-base-open/node-sdk';
import {
  IBaseService,
  BaseRecord,
  FieldSet,
  Field,
  ListTablesResponse,
  ListRecordsOptions,
  Table,
  CreateTableArgs,
  CreateTableResponse,
  CreateBaseArgs,
  UpdateBaseArgs,
  GetBaseArgs,
  CopyBaseArgs,
  ListRecordsArgs,
  ListTablesArgs,
  CommonTableArgsSchema,
  CommonTableArgs,
  ListFieldsArgs,
  CreateFieldArgs,
  UpdateTableArgs,
  CommonFieldArgs,
  UpdateFieldArgs,
  CreateRecordArgs,
  UpdateRecordArgs,
  RecordArgs,
  CreateBatchRecordArgs
} from '../types/types.js';
import { FieldType } from '../types/enums.js';
import { sessionManager } from './sessionManager.js';
import { Client, withUserAccessToken } from '@larksuiteoapi/node-sdk';

const recordLength = 100;

const optionHandler = (value: any, options: any[]) => {
  const optVal = value?.toString?.() ?? value ?? null;
  const option = options?.find((opt) => opt.id === optVal);
  return option ? option.name : optVal;
};

export class BaseService implements IBaseService {
  serviceType: 'sse' | 'stdio' = 'sse';
  _personalBaseToken: string | undefined;
  _appToken: string | undefined;
  _client: Client | undefined;
  _client2: Client | undefined;
  constructor(options?: { transport: 'sse' | 'stdio'; personalBaseToken: string; appToken: string }) {
    this.serviceType = options?.transport || 'sse';
    this._client2 = new Client({
      appId: '',
      appSecret: '',
      disableTokenCache: true,
    });
    this._client = this._client2;

    if (this.serviceType === 'stdio' && options) {
      this._personalBaseToken = options.personalBaseToken || process.env.PERSONAL_BASE_TOKEN;
      this._appToken = options.appToken || process.env.APP_TOKEN;
      if (!this._personalBaseToken || !this._appToken) {
        throw new Error('personalBaseToken and appToken must be set');
      }
      // this._client = new BaseClient({
      //   appToken: this._appToken,
      //   personalBaseToken: this._personalBaseToken,
      // });
    }
  }

  private getClient(sessionId?: string): Client {
    // logToFile('getClient', !!this._client, this.serviceType);
    return this._client!;
    if (this._client) {
      return this._client!;
    }

    // // sse 模式下，每次调用tools都创建一个client
    // const session = sessionManager.getSession(sessionId || '');
    // if (!session) {
    //   throw new Error('Session not found');
    // }

    // return new BaseClient({
    //   appToken: session.appToken,
    //   personalBaseToken: session.personalBaseToken,
    // });
  }

  private withUserAccessToken() {
    return withUserAccessToken('u-jlJhgLaSp6XVQCZqflZatElhgj0M10ypjG20glmyw5V7');
  }

  async createBase(createBaseArgs: CreateBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.create(
      {
        data: {
          name: createBaseArgs.name,
          folder_token: createBaseArgs.folder_token,
        },
      },
      this.withUserAccessToken(),
    );

    if (res?.code != 0) {
      throw new Error(`Failed to create base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async updateBase(updateBaseArgs: UpdateBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.update(
      {
        data: {
          name: updateBaseArgs.name
        },
        path: {
          app_token: updateBaseArgs.app_token,
        }
      },
      this.withUserAccessToken(),
    );

    if (res?.code != 0) {
      throw new Error(`Failed to update base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async getBase(app_token: string, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.get({
      path: {
        app_token,
      },
    }, this.withUserAccessToken());

    if (res?.code != 0) {
      throw new Error(`Failed to get Base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async copyBase(copyBaseArgs: CopyBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.copy({
      data: {
        folder_token: copyBaseArgs.folder_token,
      },
      path: {
        app_token: copyBaseArgs.app_token,
      },
    }, this.withUserAccessToken());

    if (res?.code != 0) {
      throw new Error(`Failed to copy base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async listRecords(args: ListRecordsArgs, sessionId?: string): Promise<BaseRecord[]> {
    const client = this.getClient(sessionId);
    const options = args.options;
    const params = {
      page_size: 10,
      ...options,
    };

    const records = [];

    try {
      for await (const item of await client.bitable.v1.appTableRecord.listWithIterator({
        path: args,
        // @ts-expect-error sdk fields_name类型有问题，接口是支持string[],但sdk类型是string
        params,
      }, this.withUserAccessToken())) {
        if (item?.items) {
          records.push(...item.items);
        }
        if (options?.recordLength && records.length >= options.recordLength) {
          break;
        }
      }
    } catch (error) {
      throw new Error(`Failed to list records: ${error}`);
    }

    return records;
  }

  async listTables(listTablesArgs: ListTablesArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const tables = [];

    try {
      for await (const item of await client.bitable.v1.appTable.listWithIterator({
        params: {
          page_size: 20,
        },
        path: {
          app_token: listTablesArgs.app_token,
        },
      }, this.withUserAccessToken())) {
        if (item?.items) {
          tables.push(...item.items);
        }
        if (tables.length >= recordLength) {
          break;
        }
      }
    } catch (error) {
      throw new Error(`Failed to list tables: ${error}`);
    }
    const session = sessionManager.getSession(sessionId || '');

    return {
      tables,
      baseToken: this._appToken || session?.appToken || 'undefined',
    };
  }

  async deleteTable(args: CommonTableArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTable.delete({
      path: args,
    }, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to delete table: ${msg}`);
    }

    return { success: true };
  }

  async updateTable(updateTableArgs: UpdateTableArgs, sessionId?: string): Promise<{ name?: string }> {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTable.patch(updateTableArgs, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to update table: ${msg}`);
    }

    return data?.name ? { name: data?.name } : {};
  }

  async listFields(args: ListFieldsArgs, sessionId?: string): Promise<Field[]> {
    const client = this.getClient(sessionId);
    const fields = [];
    for await (const item of await client.bitable.v1.appTableField.listWithIterator({
      path: args.path
    }, this.withUserAccessToken())) {
      if (item?.items) {
        fields.push(...item.items);
      }
      if (fields.length >= args.length) {
        break;
      }
    }
    return fields.map((field) => ({
      ...field,
      description: typeof field.description === 'string' ? { text: field.description } : field.description,
    }));
  }

  async createField(createFieldArgs: CreateFieldArgs, sessionId?: string): Promise<Field | undefined> {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableField.create(createFieldArgs, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to create field: ${msg}`);
    }

    return data?.field;
  }

  async deleteField(deleteFieldArgs: CommonFieldArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableField.delete({
      path: deleteFieldArgs,
    }, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to delete field: ${msg}`);
    }

    return { success: true };
  }

  async updateField(updateFieldArgs: UpdateFieldArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableField.update(updateFieldArgs, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to update field: ${msg}`);
    }

    return data?.field;
  }

  async createRecord(args: CreateRecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.create(args, this.withUserAccessToken());


    if (code != 0) {
      throw new Error(`Failed to create record: ${msg}`);
    }

    return data?.record || { fields: {} };
  }

  async updateRecord(updateRecordArgs: UpdateRecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.update(updateRecordArgs, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to update record: ${msg}`);
    }

    return data?.record || { fields: {} };
  }

  async deleteRecord(deleteRecordArgs: RecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { code, msg, data } = await client.bitable.v1.appTableRecord.delete({
      path: deleteRecordArgs,
    }, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to delete record: ${msg}`);
    }

    return { success: true };
  }

  async getRecord(getRecordArgs: RecordArgs, sessionId?: string): Promise<BaseRecord | null> {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.get({
      path: getRecordArgs,
    }, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to get record: ${msg}`);
    }

    return data?.record || null;
  }

  async createBatchRecord(createBatchRecordArgs: CreateBatchRecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.batchCreate(createBatchRecordArgs, this.withUserAccessToken());

    if (code != 0) {
      throw new Error(`Failed to create batch record: ${msg}`);
    }

    return data?.records || [];
  }

  async createTable(createTableArgs: CreateTableArgs, sessionId?: string): Promise<CreateTableResponse> {
    const client = this.getClient(sessionId);
    const {
      data: response,
      code,
      msg,
    } 
    = await client.bitable.v1.appTable.create({
      data: {
        // @ts-expect-error sdk此api目前ui_type枚举值类型没对齐开放平台和其他api（少了个email），先忽略
        table: createTableArgs.table,
      },
      path: {
        app_token: createTableArgs.app_token,
      },
    }, this.withUserAccessToken());

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
