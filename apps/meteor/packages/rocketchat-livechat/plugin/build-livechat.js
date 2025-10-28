import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

import UglifyJS from 'uglify-js';

const livechatSource = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js');
const livechatTarget = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js');

fs.writeFileSync(livechatTarget, UglifyJS.minify(livechatSource).code);

const packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
const pluginPath = path.join(packagePath, 'plugin');

const options = {
	env: process.env,
};

if (process.platform === 'win32') {
	execSync(`${pluginPath}/build.bat`, options);
} else {
	execSync(`sh ${pluginPath}/build.sh`, options);
}
