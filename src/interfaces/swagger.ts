export enum RequestEngine {
  AJAX,
  FETCH,
  REQUEST
}
export interface Headers {
  [key: string]: any;
}
export interface RequestOptions {
  url?: string;
  method: string;
  headers?: Headers;
  body?: any;
  formData?:{ [key: string]: any };
  form?: { [key: string]: any } | string;
}

export interface SwaggerData {
  swagger: string; //version
  info: SwaggerInfo; //提供元数据API。 可以使用元数据的客户如果需要;
  basePath?: string;
  schemes?: Array<string>;
  host?: string;
  definitions?: { //对象定义
    [key: string]: SwaggerDefinition
  },
  paths: { //可用的路径和操作的API
    [key: string]: any
  },
  tags: Array<any>;
  externalDocs?: {
    description: string;
    url: string;
  };
  securityDefinitions: {
    [key: string]: SwaggerSecurityDefinition
  }
}
export interface SwaggerDefinition {
  type?: string;
  $ref?: string;
  format?: string;
  description?: string;
  required?: Array<string>;
  properties?: {
    [key: string]: SwaggerDefinition
  };
  additionalProperties?: SwaggerDefinition;
  items?: SwaggerDefinition;
  enum?: Array<string>;
}

export interface SwaggerInfo {
  description?: string;
  version?: string;
  title?: string;
}

export interface SwaggerApiPathOption {
  [key: string]: SwaggerPathsOption;
}
export interface SwaggerParameter {
  in: string; // body, path，formData,query,header
  name: string;
  description?: string;
  required: boolean;
  type?: string;
  schema?: SwaggerDefinition;
  [key: string]: any
}
export interface SwaggerPathsOption {
  tags: Array<string>;
  summary: string;
  operationId: string;
  consumes?: Array<string>; //接收的类型
  produces?: Array<string>; //返回的数据类型
  description: string;
  parameters: Array<SwaggerParameter>;
  responses: {
    [key: string]: {
      description: string;
      headers?: Headers;
      schema?: SwaggerDefinition
    },
  },
  security?: Array<any>
  [key: string]: any
}
export interface SwaggerSecurityDefinition{
  type: string; //apiKey, oauth2
  name?: string;
  in: string; //header
  authorizationUrl?: string;
  flow?: string;
  scopes: {
    [key: string]: any
  }
}