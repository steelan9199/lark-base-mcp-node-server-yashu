| Tool 名称         | 描述                                              | 主要参数（简要）                                       |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------ |
| get_authorization | 获取 user_access_token 授权，供后续 base 工具调用 | 无                                                     |
| get_app_token     | 通过 base 的 url 获取 app_token                   | url                                                    |
| list_tables       | 列出某个 app 下的所有表                           | app_token                                              |
| create_table      | 在 base app（多维表格）中创建表单                 | table({ name, fields }), app_token                     |
| update_table      | 更新 base app（多维表格）中的表单                 | name, path(table_id, app_token)                        |
| delete_table      | 删除 app 下的表                                   | table_id, app_token                                    |
| list_records      | 列出表中的记录                                    | table_id, app_token                                    |
| create_record     | 在表中创建记录                                    | table_id, app_token, fields                            |
| delete_record     | 删除表中的记录                                    | table_id, app_token, record_id                         |
| update_record     | 更新表中的记录                                    | path(app_token, table_id, record_id), data({ fields }) |
| get_record        | 根据 ID 获取单条记录                              | table_id, app_token, record_id                         |
| list_fields       | 获取表单的字段信息                                | table_id, app_token                                    |
| create_field      | 在表单中创建字段                                  | field, path(table_id, app_token)                       |
| update_field      | 更新表单中的字段                                  | data({ field }), path(table_id, app_token, field_id)   |
| delete_field      | 删除表单中的字段                                  | table_id, app_token, field_id                          |

