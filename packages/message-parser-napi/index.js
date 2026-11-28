const native = require('./message-parser-napi.darwin-arm64.node');
const { FlatTree } = require('./flat-tree.cjs');

module.exports.parse = (input) => JSON.parse(native.parseJson(input));
module.exports.parseSerde = native.parse;
module.exports.parseJson = native.parseJson;
module.exports.parseFlat = (input) => new FlatTree(native.parseFlat(input), input);
module.exports.parseFlatRaw = native.parseFlat;
module.exports.FlatTree = FlatTree;
