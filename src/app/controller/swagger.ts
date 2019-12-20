import { Controller } from '../../slowly'
export default class HomeController extends Controller {
  async init() {
    const { argv, service } = this.ctx;
    await service.swagger.init(argv.query)
    await service.swagger.generate();
  }
}