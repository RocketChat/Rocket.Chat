/* eslint-disable import-x/no-unresolved -- the bundles exist only after a build */
if (process.env.NODE_ENV === 'production') {
	module.exports = require('./dist/fuselage.production.js');
} else {
	module.exports = require('./dist/fuselage.development.js');
}
