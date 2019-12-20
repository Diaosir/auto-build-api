import * as path from 'path';
export default {
  name: '1',
  // serviceName: function(options) {
  //   const { name } = path.parse(options.path);
  //   return name
  // },
  globalDefinitions: {
    'Response': {
      type: 'object',
      properties: {
        "code": {
          "type": "integer",
          "format": "int64",
          "description": "状态码"
        },
        "message": {
          "type": "string",
          "description": "响应消息"
        },
        "payload": {
          "type": "object",
          "description": "消息负载"
        }
      }
    }
  },
  validate: false
}