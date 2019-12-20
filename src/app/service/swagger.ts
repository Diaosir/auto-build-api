import { Service } from '../../slowly'
import Memfs from '../utils/memfs'
import { URI } from '../utils/uri';
import * as SwaggerUtils from '../utils/service-utils'
import * as path from 'path'
import { SwaggerPathsOption, SwaggerData, SwaggerDefinition, SwaggerApiPathOption } from '../interfaces/swagger'  
import formatJson from '../utils/formatJson'
import * as globRoRegExp from 'glob-to-regexp';
const outputFileSync = require('output-file-sync');
const request = require('request');
import * as ora from 'ora'
const spinner = ora('start ').start();
function getTypeScriptTypeBySwaggerType(swaggerType: string) {
  const maps = {
    'integer': 'number',
    'boolean': 'boolean',
    'string': 'string',
    'number': 'number',
    'file': 'File'
  }
  return maps[swaggerType] || 'any'
}
function globToRegArray(glob: any): Array<RegExp> {
  let globs = [];
  if(typeof glob === 'string') {
    globs.push(glob)
  } else if(Array.isArray(glob)) {
    globs = glob;
  } else {
    return []
  }
  return globs.map((glob) => {
    return globRoRegExp(glob);
  })
}
function pathIsInArray(path: string, globs: Array<RegExp>) {
  return globs.map(includeRegExp => {
    return includeRegExp.test(path);
  }).reduce((preValue, curValue) => {
    return preValue || curValue
  }, false);
}
interface SwaggerServiceOptions {
  url: string;
  name: string;
  servicesRoot: string;
  engine?: string;
  include?: Array<string> | string;
  [key: string]: any;
}
export default class SwaggerService extends Service {
  public swaggerJson: SwaggerData;
  public options: SwaggerServiceOptions;
  public swaggerFileSystem: Memfs = new Memfs();
  public serviceRoot: string = '';
  public interfaceRoot: string = '';
  public swaggerUtilUri: URI;
  public typescript: boolean = true;
  public includes: Array<RegExp> = [];
  async init(swaggerConfig: SwaggerServiceOptions) {
    const { name, servicesRoot, include } = swaggerConfig;
    this.options = swaggerConfig;
    this.includes = globToRegArray(include);
    const json = await this.getSwaggerApiDocs(`${swaggerConfig.url}`);
    this.swaggerJson = json;
    this.serviceRoot = `${servicesRoot}/${name}`;
    this.interfaceRoot = `${servicesRoot}/${name}/interfaces`;
    this.swaggerUtilUri = URI.parse(`localFs:${servicesRoot}/auto-build-api-utils${this._getExtName()}`);
    await this._createDirectory(URI.parse(`localFs:${this.serviceRoot}/index.js`));
    await this._createDirectory(URI.parse(`localFs:${this.interfaceRoot}/index.js`));
    await this._importUtilsFile();
    return this;
  }
  async generate(){
    const { paths } = this.swaggerJson;
    const { config: { globalDefinitions } } = this.ctx;
    if(!!globalDefinitions) {
      for(let name in globalDefinitions) {
        await this.gennerateDefinition(name, globalDefinitions[name]);
      }
    }
    if(!!paths) {
      for(let apiPath in paths) {
        if(this.includes.length > 0 && !pathIsInArray(apiPath, this.includes)) {
          continue;
        }
        spinner.start(`start generate path ${apiPath}`)
        try{
          await this.handlePathOption(apiPath, paths[apiPath]);
          spinner.succeed(`generate ${apiPath} api succeed`)
        } catch(error) {
          spinner.fail(`generate ${apiPath} api fail ${error}`)
        }
      }
    }

    await this.createFileToLocalFileSystem()
  }
  async getSwaggerApiDocs(url: string): Promise<SwaggerData> {
    spinner.start('start download swagger json')
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        json: true,
        url: `${url}`
      }, function(err: any, _, body: any) {
        
        if(err) {
          reject(err);
          spinner.fail('download fail')
          throw new Error(err)
        }
        spinner.succeed('download succeed')
        resolve(body);
      })
    })
  }
  async gennerateDefinition(name: string, inputDefinition: SwaggerDefinition) {
    const _this = this;
    let importCode = ''
    let code = `export interface ${name} { \n`;
    const definition = this._compineAdditionalProperties(inputDefinition);
    if (definition.properties && Object.keys(definition.properties).length > 0) {
      for(let definitionKey of Object.keys(definition.properties)) {
        const { dependencies, code: childrenCode } = await this.createDefinition(_this._isRequired(definitionKey, definition.required) ? definitionKey : `${definitionKey}?`, definition.properties[definitionKey]);
        if(Array.isArray(dependencies)) {
          dependencies.map((dependency) => {
            importCode += `import { ${dependency} } from './${dependency}';\n`
          })
        }
        if(!!childrenCode) {
          code += `${childrenCode}`
        }
      }
    }
    code += '}';
    const uri = URI.parse(`localFs:${path.join(`${this.interfaceRoot}`, `${name}${this._getExtName()}`)}`);
    await this._createDirectory(uri)
    await this.swaggerFileSystem.writeFile(uri, importCode + code, { create: true, overwrite: true});
    return {
      uri,
      code,
      importCode
    };
  }
  async createFileToLocalFileSystem() {
    this.swaggerFileSystem.walk(async (file, filepath, isADirectory) => {
      if(!isADirectory && !this.typescript && filepath.indexOf(this.interfaceRoot) > -1 ) {
        return;
      }
      !isADirectory && outputFileSync(path.join(process.cwd(), filepath), file.data, 'utf-8');
    })
  }
  /**
   * 生成API文件
   * @memberof SwaggerService
   */
  async generateApiFile(apiFilePath: string, data: any) {
    const { parametersInterfaceUri, responsesInterfaceUri } = data;
    const serviceUri = URI.parse(`localFs:${path.join(`${this.serviceRoot}`, apiFilePath)}`);
    let apiFileContent = '';
    const dirname = path.dirname(serviceUri.fsPath)
    this._compineUri([parametersInterfaceUri, responsesInterfaceUri]).map(uri => {
      const relativePath = path.relative(dirname, uri.fsPath)
      const { name } = path.parse(uri.fsPath);
      apiFileContent += `import { ${name} } from '${this._replacePathExt(relativePath)}'\n`;
    })
    apiFileContent += this._getTemplate(serviceUri.fsPath, data)
    await this._createDirectory(serviceUri)
    await this.swaggerFileSystem.writeFile(serviceUri, apiFileContent || '', { create: true, overwrite: true});
    await this._createOrUpdateIndexFile(serviceUri);
  }
  /**
   * 
   * @param path 
   * @param option 
   */
  async handlePathOption(apiPath: string, options: SwaggerApiPathOption) {
    for( let method in options) {
      const {tags, consumes, summary, produces, parameters, responses, description } = options[method];
      const contentType = (consumes && consumes[0]) || '';
      const responseType = produces[0] || '*/**';
      const name = this._getServiceName({
        ...options[method],
        path: apiPath
      });
      let apiFilePath = `${tags[0]}/${name}${this._getExtName()}`;
      let parameterInObj: any = {};
      let parametersInterfaceName = `${name.charAt(0).toUpperCase() + name.slice(1)}Req`, parametersInterfaceUri = null;
      let allInBody = Array.isArray(parameters) && parameters.length === 1 && parameters[0].in === 'body' && parameters[0].schema && parameters[0].schema.$ref;
      let params: any = {
        type: 'object',
        required: [],
        properties: {}
      };

      if(Array.isArray(parameters) && parameters.length > 0) {
        parameters.map((async parameter => {
          const { name, required, schema, type, description, in: _in } = parameter;
          if(!parameterInObj[_in]) {
            parameterInObj[_in] = [];
          }
          parameterInObj[_in].push(name);
          params.properties[name] = schema || parameter;
          if(required) {
            params.required.push(name)
          }
        }))
          //特殊处理
        if(allInBody) {
          parametersInterfaceName = await this._dynamicCreateDefinitions(parameters[0].schema.$ref);
          parametersInterfaceUri = URI.parse(`localFs:${this.interfaceRoot}/${parametersInterfaceName}${this._getExtName()}`);
        } else {
          const { uri } = await this.gennerateDefinition(parametersInterfaceName, params);
          parametersInterfaceUri = uri;
        }
      }
      const successResponse = responses[200];
      let responsesInterfaceUri = null, responsesInterfaceName = `${name.charAt(0).toUpperCase() + name.slice(1)}Resp`, responseIsArray = false;
      if(successResponse && successResponse.schema) {
        const { schema: { $ref, type, items }, schema } = successResponse;
        const ref = !!$ref ? $ref : (items && items.$ref);
        responseIsArray = type === 'array';
        if(ref) {
          const dependency = await this._dynamicCreateDefinitions(ref)
          responsesInterfaceName = dependency;
          responsesInterfaceUri = URI.parse(`localFs:${this.interfaceRoot}/${responsesInterfaceName}${this._getExtName()}`);
        } else {
          const { uri } = await this.gennerateDefinition(responsesInterfaceName, schema);
          responsesInterfaceUri = uri;
        }
      }
      const requestOptions: any = {
        url: apiPath,
        method: method.toUpperCase()
      };
      if(!!contentType) {
        requestOptions.headers = {
          'Content-Type': contentType
        }
      }
      await this.generateApiFile(apiFilePath, {
        name,
        responsesInterfaceUri,
        responsesInterfaceName: responsesInterfaceUri ? responsesInterfaceName : 'any',
        parametersInterfaceName: parametersInterfaceUri ? parametersInterfaceName : 'any',
        parametersInterfaceUri,
        options: requestOptions,
        parameterInObj: parameterInObj,
        summary,
        allInBody,
        hasParameters: !!parametersInterfaceUri,
        responseIsArray
      })
    }
  }
  private _isRequired(key, required: Array<string> = []) {
    if (!Array.isArray(required)) {
      required = []
    }
    return key === '[key: string]' || required.indexOf(key) > -1;
  }
  private async _dynamicCreateDefinitions($ref: string) {
    const modelName = this._getModelbyPath($ref);
    if(this.typescript && this.swaggerJson) {
      await this.gennerateDefinition(modelName, this.swaggerJson.definitions[modelName]);
    }
    return modelName;
  }
  private _getModelbyPath($ref: string) {
    const modelName = $ref.replace('#/definitions/', '');
    return modelName;
  }
  private _getTabString(tab: number): string {
    let tabString = '';
    for(let i = 0; i < tab; i++) {
      tabString += ' ';
    }
    return tabString;
  }
  private _simpleReplace(text: string, data: { [key: string ]: any}): string{
    return text.replace(/(\{(\w+)\})/g, function(substring, ...args) {
      const dataStr = typeof data[args[1]] !== 'string' ? JSON.stringify(data[args[1]]) : data[args[1]];
      return substring.replace(`{${args[1]}}`, dataStr)
    })
  }
  private async _createDirectory(uri: URI) {
    let dirname = path.dirname(uri.path)
    let parts = dirname.split('/');
    let file = ''
    for (const part of parts) {
      if(part === ''){
        continue;
      }
      file += `/${part}`
      const resource = uri.with({
        path: file
      })
      const stat = await this.swaggerFileSystem.stat(resource, true);
      if(!stat) { //不存在
        await this.swaggerFileSystem.mkdir(resource);
      }
    }
  }
  private async _createOrUpdateIndexFile(uri: URI) {
    const { dir, name, base} = path.parse(uri.path)
    let indexContent = `export { default as ${name} } from './${name}'`
    const indexUri = uri.with({
      path: path.join(dir, `index${this._getExtName()}`)
    })
    try{
      const data = await this.swaggerFileSystem.readFile(indexUri);
      indexContent = `${data}\n${indexContent}`
    } catch(error) {

    }
    await this.swaggerFileSystem.writeFile(indexUri, indexContent, { create: true, overwrite: true})
  }
  private async _importUtilsFile() {
    let utilsContent = ''
    Object.keys(SwaggerUtils).forEach((key) => {
      utilsContent += SwaggerUtils[key];
    })
    await this._createDirectory(this.swaggerUtilUri);
    await this.swaggerFileSystem.writeFile(this.swaggerUtilUri, utilsContent, { create: true, overwrite: false});
  }
  private _getExtName() {
    return this.typescript ? '.ts' : '.js'
  }
  private _getTemplate(filepath: string, data: any) {
    const utilRelativePath = path.relative(path.dirname(filepath), this.swaggerUtilUri.fsPath);
    const { parameterInObj, allInBody } = data;
    const hasInQuery = Array.isArray(parameterInObj.query) && parameterInObj.query.length > 0;
    const hasInPath = Array.isArray(parameterInObj.path) && parameterInObj.path.length > 0;
    const hasInBody = Array.isArray(parameterInObj.body) && parameterInObj.body.length > 0;
    const hasFormData = Array.isArray(parameterInObj.formData) && parameterInObj.formData.length > 0;
    const hasHeader = Array.isArray(parameterInObj.header) && parameterInObj.header.length > 0;
    let template = `import { request${ hasInPath ? ", replaceUrl" : ''}${hasInQuery ? ', qs' : ''}${hasInBody ? ', stringifyBody' : ''}${hasHeader ? ', setHeaders' : ''}${hasFormData ? ', setFormData' : ''} } from '${this._replacePathExt(utilRelativePath)}';
/**
 * {summary}
 */
export default async function {name}(${data.hasParameters ? `parameters${this.typescript ? ': {parametersInterfaceName}' : ''}` : ''})${this.typescript ? `: Promise<${data.responseIsArray ? 'Array<{responsesInterfaceName}>' : '{responsesInterfaceName}'}>` : ''} {
  const options${this.typescript ? ': any' : ''} = {options};\n`
  +(hasInQuery ? `  options.url += qs(${JSON.stringify(data.parameterInObj.query)}, parameters);\n`: '')
  +(hasInPath ? `  options.url = replaceUrl(options.url, ${JSON.stringify(data.parameterInObj.path)}, parameters);\n` : '')
  +(hasInBody ? `  options.body = stringifyBody(${allInBody ? '[]' : JSON.stringify(data.parameterInObj.body)}, parameters);\n` : '')
  +(hasFormData ? `  options.body = setFormData(${JSON.stringify(data.parameterInObj.formData)}, parameters);\n` : '')
  +(hasHeader ? `  options.headers = setHeaders(options.headers, ${JSON.stringify(data.parameterInObj.header)}, parameters)\n` : '')
+`  return request(options)
}`
    return this._simpleReplace(template, data)
  }
  private _replacePathExt(filepath: string): string {
    return filepath.replace(path.extname(filepath), '');
  }
  /**
   *
   * @private
   * @param {SwaggerPathsOption} pathOption
   * @returns
   * @memberof SwaggerService
   */
  private _getServiceName(pathOption: SwaggerPathsOption) {
    const { config: { serviceName }} = this.ctx;
    if(typeof serviceName === 'string') {
      return this._simpleReplace(serviceName, pathOption);
    } 
    if(typeof serviceName === 'function') {
      return serviceName(pathOption);
    }
    return pathOption.operationId
  }
  async createDefinition(name: string, definition: SwaggerDefinition, tab: number = 2, simple: boolean = false) {
    let description = `${!!definition.description ? `//${definition.description}` : ''}`;
    let dependencies: Array<string> = [];
    let code = '';
    const createArrayItem = async (definition: SwaggerDefinition) => {
      if(definition.$ref) { //引用其他类，并在头部import进来
        const modelName = await this._dynamicCreateDefinitions(definition.$ref);
        dependencies.push(modelName);
        // console.log(code)
       return modelName
      }
      return getTypeScriptTypeBySwaggerType(definition.type);
    }
    const createObjectItem = (definition: SwaggerDefinition, tab: number = 2) => {
      let description = `${!!definition.description ? `//${definition.description}` : ''}`;
      if(Array.isArray(definition.enum)) {
        description += `enum in ${JSON.stringify(definition.enum)}`;
      }
      const tabString = this._getTabString(tab);
      if (!definition.properties) {
        return `any`;
      }
      let result = `{  ${description}\n`;
      if (Object.keys(definition.properties).length > 0) {
        Object.keys(definition.properties).map((definitionKey: string) => {
          result += `${this.createDefinition(this._isRequired(definitionKey, definition.required) ? definitionKey : `${definitionKey}?`, definition.properties[definitionKey], tab + 2)}`
        })
      }
      result += `${tabString}}`
      return result;
    }
    if(Array.isArray(definition.enum)) {
      description += ` Enum: ${JSON.stringify(definition.enum)}`;
    }
    const tabString = this._getTabString(tab);
    if(definition.$ref) {
      const modelName = await this._dynamicCreateDefinitions(definition.$ref);
      dependencies.push(modelName);
      code = `${modelName}`;
    } else if (definition.type === 'object') {
      code = `${createObjectItem(this._compineAdditionalProperties(definition), tab)}`;
    } else if( definition.type === 'array') {
      const items: SwaggerDefinition = definition.items
      if(items.type !== 'object'){
        code = `Array<${await createArrayItem(items)}>`;
      } else if(!items.properties) {
        code = `Array<any>`;
      } else{
        code = `Array<${createObjectItem(items, tab)}>`;
      } 
    } else {
      code = getTypeScriptTypeBySwaggerType(definition.type)
    }
    return {
      code: simple ? code : `${tabString}${name}: ${code}; ${description}\n`,
      dependencies
    }
  }
  private _compineUri(uris: Array<URI>): Array<URI>{
    let map = new Map();
    uris.filter(uri => !!uri).map(uri => {
      map.set(uri.fsPath, uri);
    })
    return Array.from(map.values());
  }
  private _compineAdditionalProperties(definition: SwaggerDefinition) {
    return {
      ...definition,
      properties: definition.additionalProperties ? {
        ...definition.properties,
        '[key: string]': definition.additionalProperties
      } : definition.properties
    }
  }
}
