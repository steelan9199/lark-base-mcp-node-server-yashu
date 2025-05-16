/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
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
  GetAppTokenArgs,
  AuthResponse
} from '../types/types.js';
import { FieldType } from '../types/enums.js';
import { sessionManager } from './sessionManager.js';
// import { Client, withUserAccessToken } from '@larksuiteoapi/node-sdk';
import { BaseClient } from '@lark-base-open/node-sdk';


const maxRecordLength = 100;

// 发npm包先写死，后续优化
const isDev = true;
// const isDev = process.env.NODE_ENV === 'development';

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
        logger: {
          info: (...args: any[]) => {
          },
          error: (...args: any[]) => {
            console.error(...args);
          },
          warn: (...args: any[]) => {
          },
          debug: (...args: any[]) => {
          },
          trace: (...args: any[]) => {
          }
        }
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
      appToken: session.appToken || '',
      personalBaseToken: session.personalBaseToken || '',
    });
  }

  async getAuthorization(sessionId?: string) {
    const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);

    // token 不对外暴露
    if (token) {
      return {
        success: true,
      };
    }
    return {
      authUrl,
      message,
    };
  }

  // async getAppToken(args: GetAppTokenArgs, sessionId?: string): Promise<string | AuthResponse> {
  //   // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
  //   // if (authUrl) {
  //   //   return { authUrl, message };
  //   // }

  //   const client = this.getClient(sessionId);
  //   const url = new URL(args.url);
  //   if (url.pathname.startsWith('/wiki/')) {
  //     const wikiToken = url.pathname.split('/wiki/')[1];
  //     if (wikiToken) {
  //       const res = await client.space.getNode({
  //         params: {
  //           token: wikiToken,
  //         },
  //       }, withUserAccessToken(token || ''));
        
  //       if (res?.code !== 0) {
  //         throw new Error(`Failed to get wiki space: ${JSON.stringify(res)}`);
  //       }
  //       return res.data?.node?.node_token || '';
  //     }
  //     throw new Error('Invalid wiki url');
  //   } else if (url.pathname.startsWith('/base/')) {
  //     const baseToken = url.pathname.split('/base/')[1].split('?')[0];
  //     if (baseToken) {
  //       return baseToken;
  //     }
  //     throw new Error('Invalid base url');
  //   }
  //   throw new Error('URL not supported');
  // }

  private async getTokenOrAuthUrl(sessionId?: string) {
    let token = sessionManager.getUserAccessToken(sessionId) || '';
    if (!token) {
      const res = await this._client?.httpInstance.get(BASE_AUTHORIZE_URL + `?sessionId=${sessionId}`, {
        headers: {
          'x-tt-env': 'boe_mcp_authorize',
        },
      });
  
      if (res.data.userAccessToken) {
        token = res.data.userAccessToken;
      } else if (res.data.authenticationUrl) {
        return {
          authUrl: res.data.authenticationUrl,
          message: '引导用户先访问链接进行时授权，用户授权完成后尝试再次调用本工具' + `, ${JSON.stringify(sessionId)}}`,
        };
      } else {
        throw new Error(`Failed to get authorization: ${JSON.stringify(res)}`);
      }
    }
    if (token && sessionId) {
      sessionManager.setUserAccessToken(sessionId, token);
    }
    return { token };
  }

  // async createBase(args: CreateBaseArgs, sessionId?: string) {
  //   const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
  //   if (authUrl || !token) {
  //     return { authUrl, message, sessionId };
  //   }
  //   const res = await this._client.bitable.v1.app.create(
  //     {
  //       data: {
  //         name: args.name,
  //         folder_token: args.folder_token,
  //       },
  //     },
  //     withUserAccessToken(token || '')
  //   ).catch((err) => {

  //     throw new Error(`Failed to create base catch: ${JSON.stringify(err)}, ${JSON.stringify(sessionId)}, ${JSON.stringify(token)}`);
  //   })

  //   if (res?.code != 0) {
  //     throw new Error(`Failed to create base: ${JSON.stringify(res)}, ${JSON.stringify(sessionId)}, ${JSON.stringify(token)}`);
  //   }
  //   return res.data?.app!;
  // }

  // async updateBase(args: UpdateBaseArgs, sessionId?: string) {
  //   const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
  //   if (authUrl) {
  //     return { authUrl, message };
  //   }
  //   const res = await this._client.bitable.v1.app.update(
  //     {
  //       data: {
  //         name: args.name
  //       },
  //       path: {
  //         app_token: args.app_token,
  //       }
  //     },
  //     withUserAccessToken(token || ''),
  //   );

  //   if (res?.code != 0) {
  //     throw new Error(`Failed to update base: ${res?.msg}`);
  //   }
  //   return res.data?.app!;
  // }

  // async getBase(args: GetBaseArgs, sessionId?: string) {
  //   const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
  //   if (authUrl) {
  //     return { authUrl, message };
  //   }
  //   const res = await this._client.bitable.v1.app.get({
  //     path: {
  //       app_token: args.app_token,
  //     },
  //   }, withUserAccessToken(token || ''));

  //   if (res?.code != 0) {
  //     throw new Error(`Failed to get Base: ${res?.msg}`);
  //   }
  //   return res.data?.app!;
  // }

  // async copyBase(args: CopyBaseArgs, sessionId?: string) {
  //   const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
  //   if (authUrl) {
  //     return { authUrl, message };
  //   }
  //   const res = await this._client.bitable.v1.app.copy({
  //     data: {
  //       folder_token: args.folder_token,
  //     },
  //     path: {
  //       app_token: args.app_token,
  //     },
  //   }, withUserAccessToken(token || ''));

  //   if (res?.code != 0) {
  //     throw new Error(`Failed to copy base: ${res?.msg}`);
  //   }
  //   return {
  //     base: res.data?.app,
  //   };
  // }

  async listRecords(args: ListRecordsArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    
    const client = this.getClient();
    const params = {
      page_size: 10,
      // sort: args.sort,
      // filter: args.filter,
      field_names: args.field_names,
    };

    const records = [];

    try {
      for await (const item of await client.base.appTableRecord.listWithIterator({
        path: args,
        params,
      })) {
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

    return {
      records,
    };
  }

  async listTables(args: ListTablesArgs, sessionId?: string) {
    const client = this.getClient();
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const tables = [];

    try {
      for await (const item of await client.base.appTable.listWithIterator({
        params: {
          page_size: 20,
        },
      })) {
        if (item?.items) {
          tables.push(...item.items);
        }
        // if (args.length && tables.length >= args.length) {
        //   break;
        // }
      }
    } catch (error) {
      throw new Error(`Failed to list tables: ${error}`);
    }

    return tables;
  }

  async deleteTable(args: CommonTableArgs, sessionId?: string) {
    const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTable.delete({
      path: args,
    });

    if (code != 0) {
      throw new Error(`Failed to delete table: ${msg}`);
    }

    return { success: true };
  }

  async updateTable(args: UpdateTableArgs, sessionId?: string) {
    const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTable.patch({
      data: {
        name: args.name,
      },
      path: args.path,
    });

    if (code != 0) {
      throw new Error(`Failed to update table: ${msg}`);
    }

    return data?.name ? { name: data?.name } : {};
  }


  async listFields(args: ListFieldsArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const fields = [];
    for await (const item of await client.base.appTableField.listWithIterator({
      path: args.path
    })) {
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

  async createField(createFieldArgs: CreateFieldArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTableField.create({
      //@ts-expect-error
      data: createFieldArgs.field,
      path: createFieldArgs.path,
    });

    if (code != 0) {
      throw new Error(`Failed to create field: ${msg}`);
    }

    return data?.field!;
  }

  async deleteField(args: CommonFieldArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTableField.delete({
      path: args,
    });

    if (code != 0) {
      throw new Error(`Failed to delete field: ${msg}`);
    }

    return { success: true };
  }

  async updateField(args: UpdateFieldArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const data = await client.base.appTableField.update({
      //@ts-expect-error
      data: args.field,
      path: args.path,
    });

    if (data.code != 0) {
      throw new Error(`Failed to update field: ${JSON.stringify(data)}`);
    }

    return data?.data?.field!;
  }

  async createRecord(args: CreateRecordArgs, sessionId?: string) {
      // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
      // if (authUrl) {
      //   return { authUrl, message };
      // }
    const client = this.getClient();
    const data = await client.base.appTableRecord.create({
      data: {
        fields: args.fields,
      },
      path: {
        table_id: args.table_id,
      },
    });


    if (data.code != 0) {
      throw new Error(`Failed to create record: ${JSON.stringify(data)}`);
    }

    return data?.data?.record || { fields: {} };
  }

  async updateRecord(args: UpdateRecordArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const data = await client.base.appTableRecord.update({
      data: {
        fields: args.fields,
      },
      path: args.path,
    });

    if (data.code != 0) {
      throw new Error(`Failed to update record: ${JSON.stringify(data)}`);
    }

    return data?.data?.record || { fields: {} };
  }

  async deleteRecord(args: RecordArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTableRecord.delete({
      path: args,
    });

    if (code != 0) {
      throw new Error(`Failed to delete record: ${msg}`);
    }

    return { success: true };
  }

  async getRecord(args: RecordArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTableRecord.get({
      path: args,
    });

    if (code != 0) {
      throw new Error(`Failed to get record: ${msg}`);
    }

    return data?.record!;
  }

  async createBatchRecord(args: CreateBatchRecordArgs, sessionId?: string) {
      // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
      // if (authUrl) {
      //   return { authUrl, message };
      // }
    const client = this.getClient();
    const { data, code, msg } = await client.base.appTableRecord.batchCreate({
      data: {
        records: args.records,
      },
      path: args.path,
    });

    if (code != 0) {
      throw new Error(`Failed to create batch record: ${msg}`);
    }

    return data?.records || [];
  }

  async createTable(args: CreateTableArgs, sessionId?: string) {
    // const { token, authUrl, message } = await this.getTokenOrAuthUrl(sessionId);
    // if (authUrl) {
    //   return { authUrl, message };
    // }
    const client = this.getClient();
    const data = await client.base.appTable.create({
      data: {
        // @ts-expect-error sdk此api目前ui_type枚举值类型没对齐开放平台和其他api（少了个email），先忽略
        table: args.table,
      }
    });

    if (data.code != 0 || !data.data?.table_id || !data.data.field_id_list?.length) {
      throw new Error(`Failed to create table: ${JSON.stringify(data)}`);
    }
    return data.data!;
  }
}