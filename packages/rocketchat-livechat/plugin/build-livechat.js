var fs = Npm.require('fs');
var path = Npm.require('path');
var shell = Npm.require('shelljs');

var curPath = path.resolve('.')
var packagePath = path.join(path.resolve('.'), 'packages', 'rocketchat-livechat');
var pluginPath = path.join(packagePath, 'plugin');

shell.exec('sh '+pluginPath+'/build.sh');
