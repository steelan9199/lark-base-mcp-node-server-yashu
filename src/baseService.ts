/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
import { BaseClient } from '@lark-base-open/node-sdk';
import {
  IBaseService, AirtableRecord, TCreateRecordArgs, FieldSet, Field,
  FieldType, ListTablesResponse, ListRecordsOptions,
  Table,
  CreateTable,
  CreateTableResponse
} from './types.js';

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
    });
  }

  async listRecords(table_id: string, options?: ListRecordsOptions): Promise<AirtableRecord[]> {
    const params: any = {
      page_size: options?.maxRecords || 10,
    };
    
    if (options?.filterByFormula) {
      params.filter = options.filterByFormula;
    }

    const data = await this.client.base.appTableRecord.list({
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


  async listTables() {
    const tables = [];
    // const result = await this.client.base.appTable.list({
    //   params: {
    //     page_size: 20,
    //   },
    // }).catch((err) => {
    //   logToFile('listTables error: '+JSON.stringify(err)); 
    // });

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

    return {
      tables,
      baseToken: this.baseToken,
    };
  }

  async deleteTable(tableId: string) {
    const { data, code, msg } = await this.client.base.appTable.delete({
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to delete table: ${msg}`);
    }

    return { success: true };
  }

  async updateTable(tableId: string, name: string): Promise<{ name?: string }> {
    const { data, code, msg } = await this.client.base.appTable.patch({
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

  async listFields(table_id: string): Promise<Field[]> {
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

  async createField(tableId: string, field: Field): Promise<Field> {
    const { data, code, msg } = await this.client.base.appTableField.create({
      data: {
        field_name: field.field_name,
        type: field.type,
        property: field.property,
        description: typeof field.description === 'string' 
          ? { text: field.description }
          : undefined,
        ui_type: field.ui_type
      },
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to create field: ${msg}`);
    }

    return {
      field_name: data?.field?.field_name || '',
      type: data?.field?.type || 0,
      property: data?.field?.property,
      description: data?.field?.description?.text || '',
      ui_type: data?.field?.ui_type,
      is_primary: data?.field?.is_primary,
      field_id: data?.field?.field_id
    };
  }

  async deleteField(tableId: string, fieldId: string) {
    const { data, code, msg } = await this.client.base.appTableField.delete({
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

  async updateField(tableId: string, fieldId: string, field: Field) {
    const { data, code, msg } = await this.client.base.appTableField.update({
      data: {
        field_name: field.field_name,
        type: field.type,
        property: field.property,
        description: field.description ? { text: field.description } : undefined,
        ui_type: field.ui_type
      },
      path: {
        table_id: tableId,
        field_id: fieldId,  
      },
    });

    if (code != 0) {
      throw new Error(`Failed to update field: ${msg}`);
    }

    return {
      field_name: data?.field?.field_name || '',
      type: data?.field?.type || 0,
      property: data?.field?.property,
      description: data?.field?.description?.text || '',
      ui_type: data?.field?.ui_type,
      is_primary: data?.field?.is_primary,
      field_id: data?.field?.field_id
    };
  }  

  async createRecord(tableId: string, fields: TCreateRecordArgs) {
    // const fieldList = await this.listFields(tableId);
    // const fieldMap: FieldSet = {};
    // Object.entries(fields).forEach(([name, value]) => {
    //   const fieldMeta = fieldList.find((item) => item.field_name === name);
    //   if (fieldMeta) {
    //     fieldMap[name] = value;
    //   }
    // });

    const { data, code, msg } = await this.client.base.appTableRecord.create({
      data: {
        fields,
        // fields: fieldMap,
      },
      path: {
        table_id: tableId,
      },
    });

    if (code != 0) {
      throw new Error(`Failed to create record: ${msg}`);
    }

    console.log('>>>createRecord', code, msg); 

    return data?.record || { fields: {} };
  }

  async getAppToken(wikiToken: string) {
    // const { data } = await this.client.base.app.get({
    //   params: {
    //     wiki_token: wikiToken,
    //   },
    // });
  }

  async updateRecord(tableId: string, recordId: string, fields: TCreateRecordArgs) {
    const { data, code, msg } = await this.client.base.appTableRecord.update({
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

    console.log('>>>updateRecord', code, msg);
    return data?.record || { fields: {} };
  }

  async deleteRecord(tableId: string, recordId: string) {
    const { code, msg, data } = await this.client.base.appTableRecord.delete({
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

  async getRecord(tableId: string, recordId: string): Promise<AirtableRecord | null> {
    const { data, code, msg } = await this.client.base.appTableRecord.get({
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

  async createTable(request: CreateTable): Promise<CreateTableResponse> {
    const { data, code, msg } = await this.client.base.appTable.create({
      data: {
        table: {
          name: request.name,
          default_view_name: request.default_view_name,
          fields: request.fields?.map(field => ({
            field_name: field.field_name,
            type: field.type,
            ui_type: field.ui_type,
            property: field.property,
            description: typeof field.description === 'string' 
              ? { text: field.description }
              : field.description
          }))
        }
      },
    });

    console.log('>>>createTable response', code, msg);

    if (code!= 0 || !data?.table_id || !data.field_id_list?.length) {
      throw new Error(`Failed to create table: ${msg}`);
    }
    return data;
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
