import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import UglifyJS from 'uglify-js';

const livechatSource = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js');
const livechatTarget = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js');

if (process.env.CIRCLE_PR_NUMBER) {
	fs.writeFileSync(livechatTarget, fs.readFileSync(livechatSource));
} else {
	fs.writeFileSync(livechatTarget, UglifyJS.minify(livechatSource).code);
}

const packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
const pluginPath = path.join(packagePath, 'plugin');

const options = {
	env: {
		CIRCLE_PR_NUMBER: process.env.CIRCLE_PR_NUMBER,
		METEOR_PROFILE: process.env.METEOR_PROFILE,
		HOME: process.env.HOME,
	},
};

if (process.platform === 'win32') {
	execSync(`${ pluginPath }/build.bat`, options);
} else {
	execSync(`sh ${ pluginPath }/build.sh`, options);
}
