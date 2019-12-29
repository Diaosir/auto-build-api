const chalk = require('chalk');
import { Controller } from '../../slowly'


export default class HomeController extends Controller {
  async init() {
    const { argv, service } = this.ctx;
    try{
      await service.swagger.init(argv.query)
      await service.swagger.generate();
      await service.swagger.createFileToLocalFileSystem()
    } catch(error) {
      console.log(`${chalk.red('[Error]')}: ${chalk.yellow(error)}`)
    }
  }
}