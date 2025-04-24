/**
 * 创建字段/表单时字段的schema
 */
import { NumberFormatter, CurrencyCode, CurrencyPrecision, ProgressNumberFormatter, RatingSymbol, DateFormatter } from './enums.js';

export interface IBaseFiled {
  field_name: string;
  type: number;
  ui_type?:
    | 'Text'
    | 'Barcode'
    | 'Number'
    | 'Progress'
    | 'Currency'
    | 'Rating'
    | 'SingleSelect'
    | 'MultiSelect'
    | 'DateTime'
    | 'Checkbox'
    | 'User'
    | 'GroupChat'
    | 'Phone'
    | 'Url'
    | 'Attachment'
    | 'SingleLink'
    | 'Formula'
    | 'DuplexLink'
    | 'Location'
    | 'CreatedTime'
    | 'ModifiedTime'
    | 'CreatedUser'
    | 'ModifiedUser'
    | 'AutoNumber'
    | undefined;
  description?: {
    text: string;
  };
  is_primary?: boolean;
  is_hidden?: boolean;
  field_id?: string;
}

export interface INotSupportField extends IBaseFiled {
  name: string;
  field_name: '0';
}

export interface ITextField extends IBaseFiled {
  field_name: string;
  type: 1;
  ui_type?: 'Text'; // 这里本来也可以是 'Email'，但sdk没支持且目前开放平台api创建Email实际创建是Text
}

export interface IBarcodeField extends IBaseFiled {
  field_name: string;
  type: 1;
  ui_type: 'Barcode';
}

export interface INumberField extends IBaseFiled {
  field_name: string;
  type: 2;
  property?: {
    formatter?: NumberFormatter;
  };
}

export interface ICurrencyField extends IBaseFiled {
  field_name: string;
  type: 2;
  ui_type: 'Currency';
  property: {
    currency_code: CurrencyCode;
    formatter: CurrencyPrecision;
  };
}

export interface IProgressField extends IBaseFiled {
  field_name: string;
  type: 2;
  ui_type: 'Progress';
  property: {
    formatter: ProgressNumberFormatter;
  };
  range_customize?: boolean; // 是否允许自定义进度条值，默认为 false。
  min?: number; // 进度最小值，range_customize 为 true 时必填
  max?: number; // 进度最大值，range_customize 为 true 时必填
}

export interface IRatingField extends IBaseFiled {
  field_name: string;
  type: 2;
  ui_type: 'Rating';
  property: {
    formatter: '0';
    rating?: {
      symbol?: RatingSymbol; // 评分图标
    };
  };
  min: 0 | 1; // 评分最小值, 0或1
  max: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // 评分最大值，1~10之间的整数，包括1和10
}

export interface ISingleSelectField extends IBaseFiled {
  field_name: string;
  type: 3;
  property?: {
    options?: Array<{
      name?: string; // 选项名称
      id?: string; // 选项 ID。对于新增操作，不要指定选项 ID
      color?: number; // 选项颜色，默认从上一个选项的 color 开始依次递增。取值范围：0~54整数
    }>;
  };
}

export interface IMultiSelectField extends IBaseFiled {
  field_name: string;
  type: 4;
  property?: {
    options?: Array<{
      name?: string; // 选项名称
      id?: string; // 选项 ID。对于新增操作，无需指定选项 ID
      color?: number; // 选项颜色，默认从上一个选项的 color 开始依次递增。取值范围：0~54整数
    }>;
  };
}

export interface IDateTimeField extends IBaseFiled {
  field_name: string;
  type: 5;
  property?: {
    date_formatter?: DateFormatter;
    auto_fill?: boolean; // 是否自动填充当前时间，默认为 false。
  };
}

export interface ICheckboxField extends IBaseFiled {
  field_name: string;
  type: 7;
}

export interface IUserField extends IBaseFiled {
  field_name: string;
  type: 11;
  property?: {
    multiple?: boolean; // 是否允许添加多个成员，默认为 true。
  };
}

export interface IPhoneField extends IBaseFiled {
  field_name: string;
  type: 13;
}

export interface IUrlField extends IBaseFiled {
  field_name: string;
  type: 15;
}

export interface IAttachmentField extends IBaseFiled {
  field_name: string;
  type: 17;
}

export interface ISingleLinkField extends IBaseFiled {
  field_name: string;
  type: 18;
  property: {
    table_id: string; // 关联的数据表的 ID
    multiple?: boolean; // 是否允许添加多个记录，默认为 true。
  };
}

export interface ILookupField extends IBaseFiled {
  field_name: string;
  type: 19;
  property?: {
    table_id?: string;
    table_name?: string;
  };
}

export interface IFormulaField extends IBaseFiled {
  field_name: string;
  type: 20;
  property?: {
    formatter?: NumberFormatter | DateFormatter;
    formula_expression?: string; // 公式表达式
  };
}

export interface IDuplexLinkField extends IBaseFiled {
  field_name: string;
  type: 21;
  property?: {
    multiple?: boolean; // 是否允许添加多个记录，默认为 true。
    table_id: string; // 关联的数据表的 ID
    back_field_name?: string; // 关联数据表中双向关联字段的 ID，默认为 “关联的数据表名-字段名”
  };
}

export interface ILocationField extends IBaseFiled {
  field_name: string;
  type: 22;
  property?: {
    location?: {
      input_type: 'only_mobile' | 'not_limit'; // 地理位置输入限制，可选值有 only_mobile：仅允许移动端实时定位, not_limit：无限制，可输入任意地理位置
    };
  };
}

export interface IGroupChatField extends IBaseFiled {
  field_name: string;
  type: 23;
  property?: {
    multiple?: boolean; // 是否允许添加多个群组，默认为 true
  };
}

export interface IStageField extends IBaseFiled {
  field_name: string;
  type: 24;
  property?: {
    options?: Array<{
      name?: string;
      id?: string;
      color?: number;
    }>;
  };
}

export interface IObjectField extends IBaseFiled {
  field_name: string;
  type: 25;
}

export interface IDeniedField extends IBaseFiled {
  field_name: string;
  type: 403;
}

export interface ICreatedTimeField extends IBaseFiled {
  field_name: string;
  type: 1001;
  property?: {
    date_formatter?: DateFormatter;
  };
}

export interface IModifiedTimeField extends IBaseFiled {
  field_name: string;
  type: 1002;
}

export interface ICreatedUserField extends IBaseFiled {
  field_name: string;
  type: 1003;
}

export interface IModifiedUserField extends IBaseFiled {
  field_name: string;
  type: 1004;
}

export interface IAutoNumberField extends IBaseFiled {
  field_name: string;
  type: 1005;
  property?: {
    auto_serial?: {
      type: 'custom' | 'auto_increment_number';
      reformat_existing_records?: boolean; // 是否将修改应用于已有编号，默认为 false。
      options?: // 规则类型对应的值。 - 若规则类型为 "type": "system_number"，value 为范围在 1-9 的整数，表示自增数字的位数 - 若规则类型为 "type": "fixed_text"，value 为范围在 20 个字符以内的固定字符 - 若规则类型为 "type": "created_time"，value 用于指定日期的格式。可选值如下所示： - "yyyyMMdd"：日期为 20220130 的格式 - "yyyyMM"：日期为 202201 的格式 - "yyyy"：日期为 2022 的格式 - "MMdd"：日期为 130 的格式，表示 1 月 30 日 - "MM"：日期为 1 的格式，表示月份 - "dd"：日期为 30 的格式
      Array<{
        type: 'system_number' | 'fixed_text' | 'created_time';
        value: string;
      }>;
    };
  };
}
