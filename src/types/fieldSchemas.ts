import { z } from 'zod';
import { NumberFormatter, CurrencyCode, CurrencyPrecision, ProgressNumberFormatter, RatingSymbol, DateFormatter } from './enums.js';

// Base field schema
const BaseFieldSchema = z.object({
  field_name: z.string(),
  type: z.number(),
  ui_type: z.enum([
    'Text',
    'Barcode',
    'Number',
    'Progress',
    'Currency',
    'Rating',
    'SingleSelect',
    'MultiSelect',
    'DateTime',
    'Checkbox',
    'User',
    'GroupChat',
    'Phone',
    'Url',
    'Attachment',
    'SingleLink',
    'Formula',
    'DuplexLink',
    'Location',
    'CreatedTime',
    'ModifiedTime',
    'CreatedUser',
    'ModifiedUser',
    'AutoNumber'
  ]).optional(),
  description: z.object({
    disable_sync: z.boolean().optional(),
    text: z.string().optional(),
  }).optional(),
  is_primary: z.boolean().optional().describe('是否为数据表主键, 只有以下type的字段才能作为主键： 1-多行文本，2-数字，5-日期，13-电话号码，15-超链接，20-公式，22-地理位置'),
  is_hidden: z.boolean().optional(),
  field_id: z.string().optional(),
  property: z.any().optional(),
}).describe('创建字段/表单时字段的schema');

// Text Field
export const TextFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1),
  ui_type: z.enum(['Text']),
});

// Barcode Field
export const BarcodeFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1),
  ui_type: z.literal('Barcode'),
}).describe('条码（需声明 "ui_type": "Barcode"）');

// Number Field
export const NumberFieldSchema = BaseFieldSchema.extend({
  type: z.literal(2),
  ui_type: z.literal('Number'),
  property: z.object({
    formatter: z.nativeEnum(NumberFormatter).optional(),
  }).optional(),
}).describe('数字（默认值）');

// Currency Field
export const CurrencyFieldSchema = BaseFieldSchema.extend({
  type: z.literal(2),
  ui_type: z.literal('Currency'),
  property: z.object({
    currency_code: z.nativeEnum(CurrencyCode),
    formatter: z.nativeEnum(CurrencyPrecision),
  }),
}).describe('货币（需声明 "ui_type": "Currency"）');

// Progress Field
export const ProgressFieldSchema = BaseFieldSchema.extend({
  type: z.literal(2),
  ui_type: z.literal('Progress'),
  property: z.object({
    formatter: z.nativeEnum(ProgressNumberFormatter),
  }),
  range_customize: z.boolean().optional().describe('是否允许自定义进度条值，默认为 false'),
  min: z.number().optional().describe('进度最小值，range_customize 为 true 时必填'),
  max: z.number().optional().describe('进度最大值，range_customize 为 true 时必填'),
}).describe('进度（需声明 "ui_type": "Progress"）');

// Rating Field
export const RatingFieldSchema = BaseFieldSchema.extend({
  type: z.literal(2),
  ui_type: z.literal('Rating'),
  property: z.object({
    formatter: z.literal('0'),
    rating: z.object({
      symbol: z.nativeEnum(RatingSymbol).optional().describe('评分图标'),
    }).optional(),
  }),
  min: z.union([z.literal(0), z.literal(1)]).describe('评分最小值, 0或1'),
  max: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
    z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10)
  ]).describe('评分最大值，1~10之间的整数，包括1和10'),
}).describe('评分（需声明 "ui_type": "Rating"）');

// Single Select Field
export const SingleSelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal(3),
  ui_type: z.literal('SingleSelect'),
  property: z.object({
    options: z.array(z.object({
      name: z.string().optional().describe('选项名称'),
      id: z.string().optional().describe('选项 ID。对于新增操作，指定选项 ID'),
      color: z.number().min(0).max(54).optional().describe('选项颜色，默认从上一个选项的 color 开始依次递增。取值范围：0~54整数'),
    })).optional(),
  }).optional(),
});

// Multi Select Field
export const MultiSelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal(4),
  ui_type: z.literal('MultiSelect'),
  property: z.object({
    options: z.array(z.object({
      name: z.string().optional().describe('选项名称'),
      id: z.string().optional().describe('选项 ID。对于新增操作，无需指定选项 ID'),
      color: z.number().min(0).max(54).optional().describe('选项颜色，默认从上一个选项的 color 开始依次递增。取值范围：0~54整数'),
    })).optional(),
  }).optional(),
});

// DateTime Field
export const DateTimeFieldSchema = BaseFieldSchema.extend({
  type: z.literal(5),
  ui_type: z.literal('DateTime'),
  property: z.object({
    date_formatter: z.nativeEnum(DateFormatter).optional(),
    auto_fill: z.boolean().optional().describe('是否自动填充当前时间，默认为 false'),
  }).optional(),
});

// Checkbox Field
export const CheckboxFieldSchema = BaseFieldSchema.extend({
  type: z.literal(7),
  ui_type: z.literal('Checkbox'),
});

// User Field
export const UserFieldSchema = BaseFieldSchema.extend({
  type: z.literal(11),
  ui_type: z.literal('User'),
  property: z.object({
    multiple: z.boolean().optional().describe('是否允许添加多个成员，默认为 true'),
  }).optional(),
});

// Phone Field
export const PhoneFieldSchema = BaseFieldSchema.extend({
  type: z.literal(13),
  ui_type: z.literal('Phone'),
})
// URL Field
export const UrlFieldSchema = BaseFieldSchema.extend({
  type: z.literal(15),
  ui_type: z.literal('Url'),
});

// Attachment Field
export const AttachmentFieldSchema = BaseFieldSchema.extend({
  type: z.literal(17),
  ui_type: z.literal('Attachment'),
});

// Single Link Field
export const SingleLinkFieldSchema = BaseFieldSchema.extend({
  type: z.literal(18),
  ui_type: z.literal('SingleLink'),
  property: z.object({
    table_id: z.string().describe('关联的数据表的 ID'),
    multiple: z.boolean().optional().describe('是否允许添加多个记录，默认为 true'),
  }),
});

// Lookup Field
export const LookupFieldSchema = BaseFieldSchema.extend({
  type: z.literal(19),
  // ui_type: z.literal('Lookup'), // 先不加上，sdk 的ui_type还没有这个枚举值
});

// Formula Field
export const FormulaFieldSchema = BaseFieldSchema.extend({
  type: z.literal(20),
  ui_type: z.literal('Formula'),
  property: z.object({
    formatter: z.union([z.nativeEnum(NumberFormatter), z.nativeEnum(DateFormatter)]).optional(),
    formula_expression: z.string().optional().describe('公式表达式'),
  }).optional(),
});

// Duplex Link Field
export const DuplexLinkFieldSchema = BaseFieldSchema.extend({
  type: z.literal(21),
  ui_type: z.literal('DuplexLink'),
  property: z.object({
    multiple: z.boolean().optional().describe('是否允许添加多个记录，默认为 true'),
    table_id: z.string().describe('关联的数据表的 ID'),
    back_field_name: z.string().optional().describe('关联数据表中双向关联字段的 ID，默认为 "关联的数据表名-字段名"'),
  }).optional(),
}).describe('双向关联');

// Location Field
export const LocationFieldSchema = BaseFieldSchema.extend({
  type: z.literal(22),
  ui_type: z.literal('Location'),
  property: z.object({
    location: z.object({
      input_type: z.enum(['only_mobile', 'not_limit']).describe('地理位置输入限制，可选值有 only_mobile：仅允许移动端实时定位, not_limit：无限制，可输入任意地理位置'),
    }).optional(),
  }).optional(),
}).describe('地理位置');

// Group Chat Field
export const GroupChatFieldSchema = BaseFieldSchema.extend({
  type: z.literal(23),
  ui_type: z.literal('GroupChat'),
  property: z.object({
    multiple: z.boolean().optional().describe('是否允许添加多个群组，默认为 true'),
  }).optional(),
}).describe('群组');

// Created Time Field
export const CreatedTimeFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1001),
  ui_type: z.literal('CreatedTime'),
  property: z.object({
    date_formatter: z.nativeEnum(DateFormatter).optional(),
  }).optional(),
});

// Modified Time Field
export const ModifiedTimeFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1002),
  ui_type: z.literal('ModifiedTime'),
});

// Created User Field
export const CreatedUserFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1003),
  ui_type: z.literal('CreatedUser'),
});

// Modified User Field
export const ModifiedUserFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1004),
  ui_type: z.literal('ModifiedUser'),
});

// Auto Number Field
export const AutoNumberFieldSchema = BaseFieldSchema.extend({
  type: z.literal(1005),
  ui_type: z.literal('AutoNumber'),
  property: z.object({
    auto_serial: z.object({
      type: z.enum(['custom', 'auto_increment_number']),
      reformat_existing_records: z.boolean().optional().describe('是否将修改应用于已有编号，默认为 false'),
      options: z.array(z.object({
        type: z.enum(['system_number', 'fixed_text', 'created_time']),
        value: z.string().describe(`规则类型对应的值。
- 若规则类型为 "type": "system_number"，value 为范围在 1-9 的整数，表示自增数字的位数
- 若规则类型为 "type": "fixed_text"，value 为范围在 20 个字符以内的固定字符
- 若规则类型为 "type": "created_time"，value 用于指定日期的格式。可选值如下所示：
  - "yyyyMMdd"：日期为 20220130 的格式
  - "yyyyMM"：日期为 202201 的格式
  - "yyyy"：日期为 2022 的格式
  - "MMdd"：日期为 130 的格式，表示 1 月 30 日
  - "MM"：日期为 1 的格式，表示月份
  - "dd"：日期为 30 的格式`),
      })).optional(),
    }).optional(),
  }).optional(),
}).describe('自动编号');

// Union type of all field schemas
export const FieldSchema = z.union([
  BaseFieldSchema,
  TextFieldSchema,
  BarcodeFieldSchema,
  NumberFieldSchema,
  CurrencyFieldSchema,
  ProgressFieldSchema,
  RatingFieldSchema,
  SingleSelectFieldSchema,
  MultiSelectFieldSchema,
  DateTimeFieldSchema,
  CheckboxFieldSchema,
  UserFieldSchema,
  PhoneFieldSchema,
  UrlFieldSchema,
  AttachmentFieldSchema,
  SingleLinkFieldSchema,
  LookupFieldSchema,
  FormulaFieldSchema,
  DuplexLinkFieldSchema,
  LocationFieldSchema,
  GroupChatFieldSchema,
  CreatedTimeFieldSchema,
  ModifiedTimeFieldSchema,
  CreatedUserFieldSchema,
  ModifiedUserFieldSchema,
  AutoNumberFieldSchema,
]); 