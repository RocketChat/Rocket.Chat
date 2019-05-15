const path = require('path');

let pkgJson = {};

try {
	pkgJson = require(path.resolve( // eslint-disable-line import/no-dynamic-require
		process.cwd(),
		'./package.json'
	));
} catch (err) {
	console.error('no root package.json found');
}

console.log(pkgJson.version);
