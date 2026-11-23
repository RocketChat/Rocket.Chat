// The files the runtime subprocesses need, located without `import.meta`, which the Meteor server bundle cannot parse.
exports.appsEngineDir = require('node:path').dirname(require.resolve('@rocket.chat/apps-engine/package.json'));

exports.nodeRuntimeScript = require.resolve('../../../node-runtime/dist/main.js');
