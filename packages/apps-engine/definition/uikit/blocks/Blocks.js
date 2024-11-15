"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalBlockFiltersEngine = exports.BlockType = void 0;
var BlockType;
(function (BlockType) {
    BlockType["SECTION"] = "section";
    BlockType["DIVIDER"] = "divider";
    BlockType["IMAGE"] = "image";
    BlockType["ACTIONS"] = "actions";
    BlockType["CONTEXT"] = "context";
    BlockType["INPUT"] = "input";
    BlockType["CONDITIONAL"] = "conditional";
})(BlockType || (exports.BlockType = BlockType = {}));
var ConditionalBlockFiltersEngine;
(function (ConditionalBlockFiltersEngine) {
    ConditionalBlockFiltersEngine["ROCKETCHAT"] = "rocket.chat";
    ConditionalBlockFiltersEngine["LIVECHAT"] = "livechat";
})(ConditionalBlockFiltersEngine || (exports.ConditionalBlockFiltersEngine = ConditionalBlockFiltersEngine = {}));
//# sourceMappingURL=Blocks.js.map