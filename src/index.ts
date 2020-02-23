#!/usr/bin/env node
import { App } from 'slowly'
import decorator from 'slowly/decorator'
import * as path from 'path'
const app = new App({
  version: '1.0.0',
  name: 'auto-build-api',
  userConfigFile: path.join(process.cwd(), 'auto-build-api.config.js')
});
app.use(decorator())
app.start();
