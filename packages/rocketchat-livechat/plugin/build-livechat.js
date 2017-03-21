var path = Npm.require('path');
var shell = Npm.require('shelljs');
var fs = Npm.require('fs');
var UglifyJS = Npm.require('uglify-js');

var result = UglifyJS.minify(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js'));

fs.writeFileSync(path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js'), result.code);

var packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
var pluginPath = path.join(packagePath, 'plugin');

if (process.platform === 'win32') {
	shell.exec(pluginPath+'/build.bat');
} else {
	shell.exec('sh '+pluginPath+'/build.sh');
}
