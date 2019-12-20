#!/usr/bin/env node

import { App, Router } from '../slowly'
import * as path from 'path'
const router = new Router()
const app = new App({
  es6: true,
  version: '1.0.0',
  name: 'auto-build-api',
  dirname: path.dirname(__filename)
});
const { controller, config } = app.ctx;
router.register(`swagger`, 'build api by swagger ui')
      .usage('swagger <-u | --url> <-n | --name> <-d | --definitionsRoot> <-s | --servicesRoot>')
      .option('<-u | --url>', 'swagger docs url')
      .option('<-n | --name>', 'swagger service name')
      .option('<-s | --servicesRoot>', 'swagger paths build root')
      .option('[-e | --excludes]', 'swagger excludes path')
      .option('[-i | --include]', 'swagger include path')
      .action(controller.swagger.init)
app.use(router.routes());