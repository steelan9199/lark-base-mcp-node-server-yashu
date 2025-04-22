import { z } from "zod";

// 基础类型
const BaseFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean()
]).describe('基础类型');

// 文本链接类型
const TextLinkSchema = z.object({
  text: z.string().optional(),
  link: z.string().optional()
}).describe('超链接类型');

// 地理位置类型
const LocationSchema = z.object({
  location: z.string().optional(),
  pname: z.string().optional(),
  cityname: z.string().optional(),
  adname: z.string().optional(),
  address: z.string().optional(),
  name: z.string().optional(),
  full_address: z.string().optional()
}).describe('地理位置类型');

// 用户类型
const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  avatar_url: z.string().optional()
});

// 扩展用户类型
const ExtendedUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  en_name: z.string().optional(),
  email: z.string().optional()
});

// 文件类型
const FileSchema = z.object({
  file_token: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  size: z.number().optional(),
  url: z.string().optional(),
  tmp_url: z.string().optional()
}).describe('文件类型');

// 组合所有可能的字段值类型
const FieldValueSchema = z.union([
  BaseFieldValueSchema,
  TextLinkSchema,
  // LocationSchema, 这个类型有问题，地理位置在创建记录时类型为经纬度拼接字符串
  z.array(UserSchema),
  z.array(z.string()),
  z.array(ExtendedUserSchema),
  z.array(FileSchema)
]).describe(`
  -字段类型对应的传参要求
  -文本Text：填写字符串格式的值
  -数字Number：填写数字格式的值
  -单选SingleSelect：填写选项值，对于新的选项值，将会创建一个新的选项
  -多选MultiSelect：填写多个选项值，对于新的选项值，将会创建一个新的选项。如果填写多个相同的新选项值，将会创建多个相同的选项
  -日期DateTime：填写毫秒级时间戳
  -复选框Checkbox：填写 true 或 false
  -条码Barcode：填写条码值
  -人员User：填写用户的open_id、union_id 或 user_id，类型需要与 user_id_type 指定的类型一致
  -电话号码Phone：填写文本内容, 纯数字
  -超链接Url：对象，两个key，text 为文本值，link 为 URL 链接，例如 { text: '链接文本', link: 'https://www.123.com' }
  -附件Attachment：FileSchema, 填写附件 token，需要先调用上传素材或分片上传素材接口将附件上传至该多维表格中
  -单向关联Lookup：数组，填写被关联表的记录 ID
  -双向关联DuplexLink：数组，填写被关联表的记录 ID
  -地理位置Location：填写经纬度坐标，用,拼接，例如"123.124,123.124"
  `);

// 最终的Fields类型
const CreateRecordFieldsSchema = z.record(z.string(), FieldValueSchema).describe('key为字段名，value为字段值，字段名不要用字段ID');

export { CreateRecordFieldsSchema };
