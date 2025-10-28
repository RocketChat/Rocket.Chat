// prepare.js

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const modules = path.resolve(`node_modules`);
const destination = path.join(modules, 'playwright-core', 'lib', 'server', 'chromium', 'crNetworkManager.js');
const buffer = readFileSync(destination);
writeFileSync(destination, buffer.toString().replace('cacheDisabled: true', 'cacheDisabled: false'));
