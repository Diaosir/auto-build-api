export const replace = `
export function replace(text: string, data: { [key: string ]: any}): string{
  return text.replace(/(\{(\w+)\})/g, function(substring, ...args) {
    return substring.replace(\`{\${args[1]}}\`, data[args[1]])
  })
}
`
export const request =  `
export async function request(options: any): Promise<any> {
  return originalRequest(options)
}
`
export const replaceUrl = `
export function replaceUrl(url: string, inPaths: Array<string>, parameters: any): string {
  let inPathParameters = getDataFromParameters(inPaths, parameters);
  return replace(url, inPathParameters);
}
`
export const qs = `
export function qs(inQuerys: Array<string>, parameters: any): string {
  const qsStr = inQuerys.reduce((preValue, curValue) => {
    return preValue += \`&\${ curValue }=\${ parameters[curValue] }\`
  }, '?');
  return qsStr;
}
`
export const stringifyBody = `
export function stringifyBody(inBodys: Array<string>, parameters: any): string {
  let inBodyParameters = getDataFromParameters(inBodys, parameters);
  if(Object.keys(inBodyParameters).length === 0) {
    return JSON.stringify(parameters);
  }
  return JSON.stringify(inBodyParameters);
}
`
export const setFormData = `
export function setFormData(inFormDatas: Array<string>, parameters: any): FormData {
  let inFormDataParameters = getDataFromParameters(inFormDatas, parameters);
  const formData = new FormData();
  for(let key in inFormDataParameters) {
    if(Object.prototype.toString.call(inFormDataParameters[key]) === '[object Array]') {
      inFormDataParameters[key].forEach((value) => {
        formData.append(key, value);
      })
    } else {
      formData.append(key, inFormDataParameters[key]);
    }
    
  }
  return formData;
}
`
export const getDataFromParameters = `
export function getDataFromParameters(datas: Array<string>, parameters: any): any {
  let result = {};
  if(Array.isArray(datas)) {
    datas.forEach(name => {
      result[name] = parameters[name];
    })
  }
  return result;
}
`

export const setHeaders = `
export function setHeaders(headers: any, inHeaders: Array<string>, parameters: any): any {
  let inHeadersParameters = getDataFromParameters(inHeaders, parameters);
  return {
    ...headers,
    ...inHeadersParameters
  }
}`