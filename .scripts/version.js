/* eslint object-shorthand: 0, prefer-template: 0 */

const path = require('path');
var pkgJson = {};

try {
	pkgJson = require(path.resolve(
		process.cwd(),
		'./package.json'
	));
} catch (err) {
	console.error('no root package.json found');
}

console.log(pkgJson.version);
