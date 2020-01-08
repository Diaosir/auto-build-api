#!/usr/bin/env node
import { App, Router } from 'slowly'
import * as path from 'path'
const router = new Router()
const app = new App({
  version: '1.0.0',
  name: 'auto-build-api',
  userConfigFile: path.join(process.cwd(), 'auto-build-api.config.js')
});
const { controller } = app.ctx;
router.register(`swagger`, 'build api by swagger ui')
      .usage('swagger <-u | --uri> <-n | --name> <-d | --definitionsRoot> <-o | --output>')
      .option('<-u | --uri>', 'swagger docs url')
      .option('<-n | --name>', 'swagger service name')
      .option('<-o | --output>', 'swagger paths build root')
      .option('[-e | --excludes]', 'swagger excludes path')
      .option('[-i | --include]', 'swagger include path')
      .action(controller.swagger.init)
app.use(router.routes());