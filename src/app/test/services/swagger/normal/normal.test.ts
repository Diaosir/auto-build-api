// const json = require('./data.json')
import SwaggerService from '../../../../service/swagger'
const data = require('./data.json');
const swaggerService = new SwaggerService();
swaggerService.init({
  uri: '',
  name: 'api',
  output: 'src/services',
  swaggerJson: data
})
describe('test swagger services', async () => {
  await swaggerService.generate();
  // console.log(swaggerService)
})