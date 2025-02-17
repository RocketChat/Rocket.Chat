"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonStyle = exports.InputElementDispatchAction = exports.BlockElementType = void 0;
/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
var BlockElementType;
(function (BlockElementType) {
    BlockElementType["BUTTON"] = "button";
    BlockElementType["IMAGE"] = "image";
    BlockElementType["OVERFLOW_MENU"] = "overflow";
    BlockElementType["PLAIN_TEXT_INPUT"] = "plain_text_input";
    BlockElementType["STATIC_SELECT"] = "static_select";
    BlockElementType["MULTI_STATIC_SELECT"] = "multi_static_select";
})(BlockElementType || (exports.BlockElementType = BlockElementType = {}));
/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
var InputElementDispatchAction;
(function (InputElementDispatchAction) {
    InputElementDispatchAction["ON_CHARACTER_ENTERED"] = "on_character_entered";
    InputElementDispatchAction["ON_ITEM_SELECTED"] = "on_item_selected";
})(InputElementDispatchAction || (exports.InputElementDispatchAction = InputElementDispatchAction = {}));
var ButtonStyle;
(function (ButtonStyle) {
    ButtonStyle["PRIMARY"] = "primary";
    ButtonStyle["DANGER"] = "danger";
})(ButtonStyle || (exports.ButtonStyle = ButtonStyle = {}));
//# sourceMappingURL=Elements.js.map