// // const json = require('./data.json')
// import SwaggerService from '../../../service/swagger'
// const swaggerService = new SwaggerService();
// swaggerService.init({
//   url: 'http://192.168.21.14:10003/v2/api-docs?group=celebi',
//   name: 'kylin-wealth-service',
//   output: 'src/services',
// })
// describe('test swagger services', () => {
//   // test('test handlePathOption', async () => {
//   //   const option = {
//   //     "post": {
//   //       "tags": ["pet"],
//   //       "summary": "Updates a pet in the store with form data",
//   //       "description": "",
//   //       "operationId": "updatePetWithForm",
//   //       "consumes": ["application/x-www-form-urlencoded"],
//   //       "produces": ["application/json", "application/xml"],
//   //       "parameters": [{
//   //           "in": "body",
//   //           "name": "body",
//   //           "description": "Pet object that needs to be added to the store",
//   //           "required": true,
//   //           "schema": {
//   //             "$ref": "#/definitions/Pet"
//   //           }
//   //         },{
//   //         "name": "petId",
//   //         "in": "path",
//   //         "description": "ID of pet that needs to be updated",
//   //         "required": true,
//   //         "type": "integer",
//   //         "format": "int64"
//   //       }, {
//   //         "name": "name",
//   //         "in": "formData",
//   //         "description": "Updated name of the pet",
//   //         "required": false,
//   //         "type": "string"
//   //       }, {
//   //         "name": "status",
//   //         "in": "formData",
//   //         "description": "Updated status of the pet",
//   //         "required": false,
//   //         "type": "string"
//   //       }],
//   //       "responses": {
//   //         "405": {
//   //           "description": "Invalid input"
//   //         }
//   //       },
//   //       "security": [{
//   //         "petstore_auth": ["write:pets", "read:pets"]
//   //       }]
//   //     },
//   //     // "delete": {
//   //     //   "tags": ["pet"],
//   //     //   "summary": "Deletes a pet",
//   //     //   "description": "",
//   //     //   "operationId": "deletePet",
//   //     //   "produces": ["application/json", "application/xml"],
//   //     //   "parameters": [{
//   //     //     "name": "api_key",
//   //     //     "in": "header",
//   //     //     "required": false,
//   //     //     "type": "string"
//   //     //   }, {
//   //     //     "name": "petId",
//   //     //     "in": "path",
//   //     //     "description": "Pet id to delete",
//   //     //     "required": true,
//   //     //     "type": "integer",
//   //     //     "format": "int64"
//   //     //   }],
//   //     //   "responses": {
//   //     //     "400": {
//   //     //       "description": "Invalid ID supplied"
//   //     //     },
//   //     //     "404": {
//   //     //       "description": "Pet not found"
//   //     //     }
//   //     //   },
//   //     //   "security": [{
//   //     //     "petstore_auth": ["write:pets", "read:pets"]
//   //     //   }]
//   //     // }
//   //   }
//   //   const res = await swaggerService.handlePathOption('/pet/{petId}', option);
//   // })
//   test('test createDefinition additionalProperties Array', async () => {
//     const result = await swaggerService.createDefinition('GetBBSIndexDataResp', {"type":"object","properties":{"act":{"type":"integer","format":"int32","description":"null,"},"data":{"type":"object","description":"返回的数据,","additionalProperties":{"type":"array","items":{"$ref":"#/definitions/Article"}}},"topic":{"description":"null,","$ref":"#/definitions/GetTopicRandomListResp"}}}, 0, true)
//     const correct = {
//       code: '{  \n  act?: number; //null,\n  topic?: GetTopicRandomListResp; //null,\n  data?: {  //返回的数据,\n    [key: string]: Array<Article>; \n  }; //返回的数据,\n}',
//       dependencies: ['GetTopicRandomListResp', 'Article']
//     }
//     expect(result).toMatchObject(correct)
//   })
// })