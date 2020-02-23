const chalk = require('chalk');
import { Controller } from 'slowly'
import { Option, Description, Alias } from 'slowly/decorator'
export default class HomeController extends Controller {
  @Option('-u, --uri <uri>', 'swagger docs url')
  @Option('-n, --name <name>', 'swagger service name')
  @Option('-o, --output <output>', 'swaggswagger paths build rooter')
  @Option('-i, --include', 'swaggswagger include')
  @Description('swagger api')
  async index() {
    const { query, service } = this.ctx;
    try{
      await service.swagger.init(query)
      await service.swagger.generate();
      await service.swagger.createFileToLocalFileSystem()
    } catch(error) {
      console.log(`${chalk.red('[Error]')}: ${chalk.yellow(error)}`)
    }
  }
  @Description('保存json文件')
  async set() {

  }
  @Description('list all swagger api')
  @Alias('ls')
  async list() {

  }
  @Description('list all swagger api')
  
  async list2() {

  }
  @Description('add one swagger json')
  @Option('<uri>', 'swagger uri')
  @Option('<name>', 'swagger name')
  @Option('-d, --description', 'swagger uri description')
  async add() {
    const { uri, name, description } = this.ctx.query;

  }
}
