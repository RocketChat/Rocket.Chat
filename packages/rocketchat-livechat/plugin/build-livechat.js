import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import UglifyJS from 'uglify-js';

if (process.env.CIRCLE_PR_NUMBER) {
	const result = fs.readFileSync(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js'));

	fs.writeFileSync(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js'), result);
} else {
	const result = UglifyJS.minify(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js'));

	fs.writeFileSync(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js'), result.code);
}

const packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
const pluginPath = path.join(packagePath, 'plugin');

const options = {
	env: {
		CIRCLE_PR_NUMBER: process.env.CIRCLE_PR_NUMBER,
		METEOR_PROFILE: process.env.METEOR_PROFILE,
	},
};

if (process.platform === 'win32') {
	execSync(`${ pluginPath }/build.bat`, options);
} else {
	execSync(`sh ${ pluginPath }/build.sh`, options);
}
