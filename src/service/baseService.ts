/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
import { AppType, BaseClient } from '@lark-base-open/node-sdk';
import {
  IBaseService,
  BaseRecord,
  FieldSet,
  Field,
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
  CreateBatchRecordArgs,
  GetAppTokenArgs
} from '../types/types.js';
import { FieldType } from '../types/enums.js';
import { sessionManager } from './sessionManager.js';
import { Client, withUserAccessToken } from '@larksuiteoapi/node-sdk';

const maxRecordLength = 100;

const isDev = process.env.NODE_ENV === 'development';

const BASE_AUTHORIZE_URL = 'https://bytedance.feishu-boe.net/space/api/bitable/base_ai/v1/authorize/get_token';

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
      domain: isDev ? 'https://open.feishu-boe.cn' : '',
    });
    this._client = this._client2;

    if (this.serviceType === 'stdio' && options) {
      // this._personalBaseToken = options.personalBaseToken || process.env.PERSONAL_BASE_TOKEN;
      // this._appToken = options.appToken || process.env.APP_TOKEN;
      // if (!this._personalBaseToken || !this._appToken) {
      //   throw new Error('personalBaseToken and appToken must be set');
      // }
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

  async getAuthUrlOrToken(sessionId?: string) {
    const data = await this._client2?.httpInstance.get(BASE_AUTHORIZE_URL + `?sessionId=${sessionId}`, {
      headers: {
        'x-tt-env': 'boe_mcp_authorize',
      },
    });
    if (data?.code != 0 || (!data?.data?.authenticationUrl && !data?.data?.userAccessToken)) {
      throw new Error(`Failed to get authorization: ${JSON.stringify(data)}`);
    }

    console.log('getAuthorizationUrl', data.data);

    if (data.data.userAccessToken) {
      return data.data.userAccessToken;
    }
    return {
      authUrl: data.data.authenticationUrl
    };
  }

  async getAuthToken(sessionId?: string) {
    const data = await this._client2?.httpInstance.get(BASE_AUTHORIZE_URL + `?sessionId=${sessionId}`, {
      headers: {
        'x-tt-env': 'boe_mcp_authorize',
      },
    });

    if (data?.code != 0 || !data?.data?.userAccessToken) {
      throw new Error(`Failed to get authorization token: ${JSON.stringify(data)}`);
    }
    console.log('getAuthorizationToken', data.data);
    return data?.data?.userAccessToken;
  }

  async getAppToken(args: GetAppTokenArgs, sessionId?: string) {
    const url = new URL(args.url);
    if (url.pathname.startsWith('/wiki/')) {
      const wikiToken = url.pathname.split('/wiki/')[1];
      if (wikiToken) {
        const res = await this._client2?.wiki.v2.space.getNode({
          params: {
            token: wikiToken,
          },
        }, withUserAccessToken(args.user_access_token));
        
        if (res?.code !== 0) {
          throw new Error(`Failed to get wiki space: ${JSON.stringify(res)}`);
        }
        return res.data?.node?.node_token;
      }
      throw new Error('Invalid wiki url');
    } else if (url.pathname.startsWith('/base/')) {
      const baseToken = url.pathname.split('/base/')[1].split('?')[0];
      if (baseToken) {
        return baseToken;
      }
      throw new Error('Invalid base url');
    }
    throw new Error('URL not supported');
  }

  async createBase(args: CreateBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.create(
      {
        data: {
          name: args.name,
          folder_token: args.folder_token,
        },
      },
      withUserAccessToken(args.user_access_token)
    );

    if (res?.code != 0) {
      throw new Error(`Failed to create base: ${JSON.stringify(res)}`);
    }
    return res.data?.app;
  }

  async updateBase(args: UpdateBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.update(
      {
        data: {
          name: args.name
        },
        path: {
          app_token: args.app_token,
        }
      },
      withUserAccessToken(args.user_access_token),
    );

    if (res?.code != 0) {
      throw new Error(`Failed to update base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async getBase(args: GetBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.get({
      path: {
        app_token: args.app_token,
      },
    }, withUserAccessToken(args.user_access_token));

    if (res?.code != 0) {
      throw new Error(`Failed to get Base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async copyBase(args: CopyBaseArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const res = await this._client2?.bitable.v1.app.copy({
      data: {
        folder_token: args.folder_token,
      },
      path: {
        app_token: args.app_token,
      },
    }, withUserAccessToken(args.user_access_token));

    if (res?.code != 0) {
      throw new Error(`Failed to copy base: ${res?.msg}`);
    }
    return res.data?.app;
  }

  async listRecords(args: ListRecordsArgs, sessionId?: string): Promise<BaseRecord[]> {
    const client = this.getClient(sessionId);
    const params = {
      page_size: 10,
      sort: args.sort,
      filter: args.filter,
      field_names: args.field_names,
    };

    const records = [];

    try {
      for await (const item of await client.bitable.v1.appTableRecord.listWithIterator({
        path: args,
        // @ts-expect-error sdk fields_name类型有问题，接口是支持string[],但sdk类型是string
        params,
      }, withUserAccessToken(args.user_access_token))) {
        if (item?.items) {
          records.push(...item.items);
        }
        if (args?.recordLength && records.length >= args.recordLength) {
          break;
        }
      }
    } catch (error) {
      throw new Error(`Failed to list records: ${error}`);
    }

    return records;
  }

  async listTables(args: ListTablesArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const tables = [];

    try {
      for await (const item of await client.bitable.v1.appTable.listWithIterator({
        params: {
          page_size: 20,
        },
        path: {
          app_token: args.app_token,
        },
      }, withUserAccessToken(args.user_access_token))) {
        if (item?.items) {
          tables.push(...item.items);
        }
        if (args.length && tables.length >= args.length) {
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
    }, withUserAccessToken(args.user_access_token));

    if (code != 0) {
      throw new Error(`Failed to delete table: ${msg}`);
    }

    return { success: true };
  }

  async updateTable(args: UpdateTableArgs, sessionId?: string): Promise<{ name?: string }> {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTable.patch({
      data: {
        name: args.name,
      },
      path: args.path,
    }, withUserAccessToken(args.user_access_token));

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
    }, withUserAccessToken(args.user_access_token))) {
      if (item?.items) {
        fields.push(...item.items);
      }
      if (args.length &&fields.length >= args.length) {
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
    const { data, code, msg } = await client.bitable.v1.appTableField.create(createFieldArgs, withUserAccessToken(createFieldArgs.user_access_token));

    if (code != 0) {
      throw new Error(`Failed to create field: ${msg}`);
    }

    return data?.field;
  }

  async deleteField(args: CommonFieldArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const token = args.user_access_token;
    Reflect.deleteProperty(args, 'user_access_token');
    const { data, code, msg } = await client.bitable.v1.appTableField.delete({
      path: args,
    }, withUserAccessToken(token));

    if (code != 0) {
      throw new Error(`Failed to delete field: ${msg}`);
    }

    return { success: true };
  }

  async updateField(args: UpdateFieldArgs, sessionId?: string) {
      const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableField.update({
      data: args.data,
      path: args.path,
    }, withUserAccessToken(args.user_access_token));

    if (code != 0) {
      throw new Error(`Failed to update field: ${msg}`);
    }

    return data?.field;
  }

  async createRecord(args: CreateRecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.create({
      data: {
        fields: args.fields,
      },
      path: {
        app_token: args.app_token,
        table_id: args.table_id,
      },
    }, withUserAccessToken(args.user_access_token));


    if (code != 0) {
      throw new Error(`Failed to create record: ${msg}`);
    }

    return data?.record || { fields: {} };
  }

  async updateRecord(args: UpdateRecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.update({
      data: {
        fields: args.fields,
      },
      path: args.path,
    }, withUserAccessToken(args.user_access_token));

    if (code != 0) {
      throw new Error(`Failed to update record: ${msg}`);
    }

    return data?.record || { fields: {} };
  }

  async deleteRecord(args: RecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const token = args.user_access_token;
    Reflect.deleteProperty(args, 'user_access_token');
    const { code, msg, data } = await client.bitable.v1.appTableRecord.delete({
      path: args,
    }, withUserAccessToken(token));

    if (code != 0) {
      throw new Error(`Failed to delete record: ${msg}`);
    }

    return { success: true };
  }

  async getRecord(args: RecordArgs, sessionId?: string): Promise<BaseRecord | null> {
    const client = this.getClient(sessionId);
    const token = args.user_access_token;
    Reflect.deleteProperty(args, 'user_access_token');
    const { data, code, msg } = await client.bitable.v1.appTableRecord.get({
      path: args,
    }, withUserAccessToken(token));

    if (code != 0) {
      throw new Error(`Failed to get record: ${msg}`);
    }

    return data?.record || null;
  }

  async createBatchRecord(args: CreateBatchRecordArgs, sessionId?: string) {
    const client = this.getClient(sessionId);
    const { data, code, msg } = await client.bitable.v1.appTableRecord.batchCreate({
      data: {
        records: args.records,
      },
      path: args.path,
    }, withUserAccessToken(args.user_access_token));

    if (code != 0) {
      throw new Error(`Failed to create batch record: ${msg}`);
    }

    return data?.records || [];
  }

  async createTable(args: CreateTableArgs, sessionId?: string): Promise<CreateTableResponse> {
    const client = this.getClient(sessionId);
    const {
      data: response,
      code,
      msg,
    } 
    = await client.bitable.v1.appTable.create({
      data: {
        // @ts-expect-error sdk此api目前ui_type枚举值类型没对齐开放平台和其他api（少了个email），先忽略
        table: args.table,
      },
      path: {
        app_token: args.app_token,
      },
    }, withUserAccessToken(args.user_access_token));

    if (code != 0 || !response?.table_id || !response.field_id_list?.length) {
      throw new Error(`Failed to create table: ${msg}`);
    }
    return response;
  }
}