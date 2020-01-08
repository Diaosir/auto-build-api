
import request from 'request';
/**
 * {summary}
 */
export default async function name(parameters: any): Promise<any> {
  console.log(parameters)
  const parameterInObj:any = '{parameterInObj}';
  const options:any = '{options}';
  if(Array.isArray(parameterInObj.query) && parameterInObj.query.length > 0) {
    const qs = parameterInObj.query.reduce()
  }
  return request({
    ...options
  })
}
