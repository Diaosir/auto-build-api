export default `
import {
  <%if(hasInPath){%>replaceUrl, <%}%><%if(hasInQuery){%>qs, <%}%><%if(hasInBody){%>stringifyBody, <%}%><%if(hasHeader){%>setHeaders, <%}%><%if(hasFormData){%>setFormData, <%}%>request
} from '<%= utilFilePath%>'
<% if(typescript) { %> 
/**
 * <%=summary %>
 */
export default async function <%= name%>(<% if(hasParameters) {%>parameters: <%= parametersInterfaceName %><%}%>): Promise<<% if(responseIsArray) {%>Array<<%= responsesInterfaceName %>><% } else {%><%= responsesInterfaceName %><% }%>> {
  const options: any = <%- JSON.stringify(options) %>;
  options.url= \`<%= url%>\`\n`
  + '<% if(hasInQuery) {%>  options.url += qs(<%-JSON.stringify(parameterInObj.query)%>, parameters);\n<%}%>'
  + '<% if(hasInPath) {%>  options.url = replaceUrl(options.url, <%-JSON.stringify(parameterInObj.path)%>, parameters);\n<%}%>'
  + '<% if(hasInBody) {%>  options.body = stringifyBody(<% if(allInBody) {%>[]<% } else {%><%-JSON.stringify(parameterInObj.body)%><%}%>, parameters);\n<%}%>'
  + '<% if(hasFormData) {%>  options.body = setFormData(<%-JSON.stringify(parameterInObj.formData)%>, parameters);\n<%}%>'
  + '<% if(hasHeader) {%>  options.headers = setHeaders(options.header, <%-JSON.stringify(parameterInObj.header)%>, parameters);\n<%}%>'
  + `  return request(options)
}
<% } else { %> 

<% } %>

`