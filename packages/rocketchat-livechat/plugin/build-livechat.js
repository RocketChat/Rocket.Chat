const path = Npm.require('path');
const shell = Npm.require('shelljs');
const fs = Npm.require('fs');
const UglifyJS = Npm.require('uglify-js');

const result = UglifyJS.minify(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js'));

fs.writeFileSync(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js'), result.code);

const packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
const pluginPath = path.join(packagePath, 'plugin');

if (process.platform === 'win32') {
	shell.exec(`${ pluginPath }/build.bat`);
} else {
	shell.exec(`sh ${ pluginPath }/build.sh`);
}
