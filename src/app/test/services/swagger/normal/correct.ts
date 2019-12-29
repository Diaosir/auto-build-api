export default 
`import { GetAnnualFootprintReq, ResponseOfGetAnnualFootprintResp } from '../interfaces'
import { request, stringifyBody } from '../../auto-build-api-utils';
/**
 * 获取用户年度足迹数据
 */
export default async function getAnnualFootprint(parameters: GetAnnualFootprintReq): Promise<ResponseOfGetAnnualFootprintResp> {
  const options: any = {"url":"/pfriendService/getAnnualFootprint","method":"POST","headers":{"Content-Type":"application/json"}};
  options.body = stringifyBody([], parameters);
  return request(options)
}`