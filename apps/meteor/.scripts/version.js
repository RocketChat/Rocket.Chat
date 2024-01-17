const path = require('path');

let pkgJson = {};

try {
	// eslint-disable-next-line import/no-dynamic-require
	pkgJson = require(path.resolve(process.cwd(), './package.json'));
} catch (err) {
	console.error('no root package.json found');
}

console.log(pkgJson.version);
