/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
import { BaseClient } from '@lark-base-open/node-sdk';
import {
  IBaseService, AirtableRecord, TCreateRecordArgs, FieldSet, Field,
  FieldType,
} from './types.js';

import fs from 'fs';
function logToFile(message: any) {
  // fs.appendFileSync('debug.log', JSON.stringify(message) + '\n');
}

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

export class BaseService implements IBaseService {
  private readonly client: BaseClient;
  private readonly _baseToken: string;
  private readonly _personalBaseToken: string;

  get baseToken() {
    return this._baseToken;
  }

  get personalBaseToken() {
    return this._personalBaseToken;
  }

  constructor(baseToken: string, personalBaseToken: string) {
    if (!baseToken) {
      throw new Error('airtable-mcp-server: No base token provided.');
    }
    if (!personalBaseToken) {
      throw new Error('airtable-mcp-server: No personal base token provided.');
    }

    this._baseToken = baseToken;
    this._personalBaseToken = personalBaseToken;

    this.client = new BaseClient({
      appToken: baseToken,
      personalBaseToken,
      // domain: 'https://fsopen.bytedance.net'
    });
  }

  async listRecords(table_id: string): Promise<AirtableRecord[]> {
    // console.log(111);
    const records = [];
    const data = await this.client.base.appTableRecord.list({
      path: {
        table_id,
      },
      params: {
        page_size: 10,
      },
    });

    logToFile('listRecords'+JSON.stringify(data));  
    return data.data?.items ?? [];
  }

  async listTables() {
    const tables = [];
    // const result = await this.client.base.appTable.list({
    //   params: {
    //     page_size: 20,
    //   },
    // }).catch((err) => {
    //   logToFile('listTables error: '+JSON.stringify(err)); 
    // });

    try {
      for await (const item of await this.client.base.appTable.listWithIterator({
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
    } catch(err) {
      logToFile('listTables error: '+JSON.stringify(err)); 
    }
    logToFile('listTables tables: '+JSON.stringify(tables)); 

    return {
      tables,
      baseToken: this.baseToken,
    };
  }

  async listFields(table_id: string) {
    const fields = [];
    for await (const item of await this.client.base.appTableField.listWithIterator({
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
    return fields;
  }

  async createRecord(tableId: string, fields: TCreateRecordArgs) {
    const fieldList = await this.listFields(tableId);
    const fieldMap: FieldSet = {};
    Object.entries(fields).forEach(([name, value]) => {
      const fieldMeta = fieldList.find((item) => item.field_name === name);
      if (fieldMeta) {
        fieldMap[name] = value;
      }
    });

    const { data } = await this.client.base.appTableRecord.create({
      data: {
        fields: fieldMap,
      },
      path: {
        table_id: tableId,
      },
    });

    return data?.record || { fields: {} };
  }

  async getAppToken(wikiToken: string) {
    // const { data } = await this.client.base.app.get({
    //   params: {
    //     wiki_token: wikiToken,
    //   },
    // });
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
  // ): Promise<AirtableRecord[]> {
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
