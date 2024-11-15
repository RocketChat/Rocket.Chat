"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.name = name;
/**
 * @internal
 */
function metadata() {
    halt("metadata");
}
var metadataPure = /** @__PURE__ */ Object.assign(metadata, { from: function (input) { return input; } });
exports.metadata = metadataPure;
function name() {
    halt("name");
}
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.reflect.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=reflect.js.map