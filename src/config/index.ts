import * as path from 'path';
export default {
  swagger: {
    prefix: '${APIPERFIX2}/letterAdmin',
    name: '1',
    compineInterface: true,
    serviceName: function(options) {
      const { name } = path.parse(options.path);
      return name
    },
    globalDefinitions: {
      'CommonRequestOptions': {
        type: 'object',
        properties: {
          "$path": {
            "type": "string",
            "description": 'replace path'
          },
          "$timeout": {
            "type": 'number',
            "description": "$timeout"
          }
        }
      },
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
}