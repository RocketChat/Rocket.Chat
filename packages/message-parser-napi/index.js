const native = require('./message-parser-napi.darwin-arm64.node');

module.exports.parse = (input) => JSON.parse(native.parseJson(input));
module.exports.parseSerde = native.parse;
module.exports.parseJson = native.parseJson;
