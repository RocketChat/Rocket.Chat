"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRoomActionButtonUserInteraction = exports.isMesssageActionButtonUserInteraction = exports.isUserDropdownActionButtonUserInteraction = exports.isMessageBoxActionButtonUserInteraction = exports.isViewSubmitUserInteraction = exports.isViewClosedUserInteraction = exports.isViewBlockActionUserInteraction = exports.isMessageBlockActionUserInteraction = void 0;
var typia_1 = __importDefault(require("typia"));
exports.isMessageBlockActionUserInteraction = (function () { var $io0 = function (input) { return "blockAction" === input.type && "string" === typeof input.actionId && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && ("object" === typeof input.container && null !== input.container && $io2(input.container)) && "string" === typeof input.mid && (undefined === input.tmid || "string" === typeof input.tmid) && "string" === typeof input.rid && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "string" === typeof input.blockId && true; }; var $io2 = function (input) { return "message" === input.type && "string" === typeof input.id; }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isViewBlockActionUserInteraction = (function () { var $io0 = function (input) { return "blockAction" === input.type && "string" === typeof input.actionId && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && ("object" === typeof input.container && null !== input.container && $io2(input.container)) && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "string" === typeof input.blockId && true; }; var $io2 = function (input) { return "view" === input.type && "string" === typeof input.id; }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isViewClosedUserInteraction = (function () { var $io0 = function (input) { return "viewClosed" === input.type && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "string" === typeof input.viewId && ("object" === typeof input.view && null !== input.view && $io2(input.view)) && (undefined === input.isCleared || "boolean" === typeof input.isCleared); }; var $io2 = function (input) { return "string" === typeof input.appId && (Array.isArray(input.blocks) && input.blocks.every(function (elem) { return "object" === typeof elem && null !== elem && $iu0(elem); })) && "string" === typeof input.id && ("object" === typeof input.state && null !== input.state && false === Array.isArray(input.state) && $io45(input.state)); }; var $io3 = function (input) { return "actions" === input.type && (Array.isArray(input.elements) && input.elements.every(function (elem) { return "object" === typeof elem && null !== elem && $iu1(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io4 = function (input) { return "button" === input.type && ("object" === typeof input.text && null !== input.text && $io5(input.text)) && (undefined === input.url || "string" === typeof input.url) && (undefined === input.value || "string" === typeof input.value) && (undefined === input.style || "primary" === input.style || "danger" === input.style || "secondary" === input.style || "warning" === input.style || "success" === input.style) && (undefined === input.secondary || "boolean" === typeof input.secondary) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io5 = function (input) { return "plain_text" === input.type && "string" === typeof input.text && (undefined === input.emoji || "boolean" === typeof input.emoji) && (undefined === input.i18n || "object" === typeof input.i18n && null !== input.i18n && $io6(input.i18n)); }; var $io6 = function (input) { return "string" === typeof input.key && (undefined === input.args || "object" === typeof input.args && null !== input.args && false === Array.isArray(input.args) && $io7(input.args)); }; var $io7 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return "string" === typeof value || "number" === typeof value;
}); }; var $io8 = function (input) { return "object" === typeof input.title && null !== input.title && $io5(input.title) && ("object" === typeof input.text && null !== input.text && $iu3(input.text)) && ("object" === typeof input.confirm && null !== input.confirm && $io5(input.confirm)) && ("object" === typeof input.deny && null !== input.deny && $io5(input.deny)) && ("primary" === input.style || "danger" === input.style); }; var $io9 = function (input) { return "mrkdwn" === input.type && "string" === typeof input.text && (undefined === input.verbatim || "boolean" === typeof input.verbatim) && (undefined === input.i18n || "object" === typeof input.i18n && null !== input.i18n && $io6(input.i18n)); }; var $io10 = function (input) { return "channels_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io11 = function (input) { return "conversations_select" === input.type && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io12 = function (input) { return "datepicker" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (undefined === input.initialDate || "string" === typeof input.initialDate) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io13 = function (input) { return "linear_scale" === input.type && (undefined === input.minValue || "number" === typeof input.minValue) && (undefined === input.maxValue || "number" === typeof input.maxValue) && (undefined === input.initialValue || "number" === typeof input.initialValue) && (undefined === input.preLabel || "object" === typeof input.preLabel && null !== input.preLabel && $io5(input.preLabel)) && (undefined === input.postLabel || "object" === typeof input.postLabel && null !== input.postLabel && $io5(input.postLabel)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io14 = function (input) { return "multi_static_select" === input.type && ("object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.optionGroups || Array.isArray(input.optionGroups) && input.optionGroups.every(function (elem) { return "object" === typeof elem && null !== elem && $io16(elem); })) && (undefined === input.maxSelectItems || "number" === typeof input.maxSelectItems) && (undefined === input.initialValue || Array.isArray(input.initialValue) && input.initialValue.every(function (elem) { return "string" === typeof elem; })) && (undefined === input.initialOption || Array.isArray(input.initialOption) && input.initialOption.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io15 = function (input) { return "object" === typeof input.text && null !== input.text && $iu3(input.text) && "string" === typeof input.value && (undefined === input.description || "object" === typeof input.description && null !== input.description && $io5(input.description)) && (undefined === input.url || "string" === typeof input.url); }; var $io16 = function (input) { return "object" === typeof input.label && null !== input.label && $io5(input.label) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })); }; var $io17 = function (input) { return "multi_channels_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io18 = function (input) { return "multi_conversations_select" === input.type && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io19 = function (input) { return "multi_users_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io20 = function (input) { return "overflow" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io21 = function (input) { return "static_select" === input.type && ("object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.optionGroups || Array.isArray(input.optionGroups) && input.optionGroups.every(function (elem) { return "object" === typeof elem && null !== elem && $io16(elem); })) && (undefined === input.initialOption || "object" === typeof input.initialOption && null !== input.initialOption && $io15(input.initialOption)) && (undefined === input.initialValue || "string" === typeof input.initialValue) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io22 = function (input) { return "users_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io23 = function (input) { return "toggle_switch" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.initialOptions || Array.isArray(input.initialOptions) && input.initialOptions.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io24 = function (input) { return "checkbox" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.initialOptions || Array.isArray(input.initialOptions) && input.initialOptions.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io25 = function (input) { return "radio_button" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.initialOption || "object" === typeof input.initialOption && null !== input.initialOption && $io15(input.initialOption)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io26 = function (input) { return "time_picker" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (undefined === input.initialTime || "string" === typeof input.initialTime) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io27 = function (input) { return "callout" === input.type && (undefined === input.title || "object" === typeof input.title && null !== input.title && $iu3(input.title)) && ("object" === typeof input.text && null !== input.text && $iu3(input.text)) && (undefined === input.variant || "danger" === input.variant || "warning" === input.variant || "success" === input.variant || "info" === input.variant) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io28 = function (input) { return "context" === input.type && (Array.isArray(input.elements) && input.elements.every(function (elem) { return "object" === typeof elem && null !== elem && $iu2(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io29 = function (input) { return "image" === input.type && "string" === typeof input.imageUrl && "string" === typeof input.altText; }; var $io30 = function (input) { return "divider" === input.type && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io31 = function (input) { return "tab_navigation" === input.type && (Array.isArray(input.tabs) && input.tabs.every(function (elem) { return "object" === typeof elem && null !== elem && $io32(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io32 = function (input) { return "tab" === input.type && ("object" === typeof input.title && null !== input.title && $iu3(input.title)) && (undefined === input.disabled || "boolean" === typeof input.disabled) && (undefined === input.selected || "boolean" === typeof input.selected) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io33 = function (input) { return "image" === input.type && "string" === typeof input.imageUrl && "string" === typeof input.altText && (undefined === input.title || "object" === typeof input.title && null !== input.title && $io5(input.title)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io34 = function (input) { return "input" === input.type && ("object" === typeof input.label && null !== input.label && $io5(input.label)) && ("object" === typeof input.element && null !== input.element && $iu5(input.element)) && (undefined === input.hint || "object" === typeof input.hint && null !== input.hint && $io5(input.hint)) && (undefined === input.optional || "boolean" === typeof input.optional) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io35 = function (input) { return "plain_text_input" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && (undefined === input.initialValue || "string" === typeof input.initialValue) && (undefined === input.multiline || "boolean" === typeof input.multiline) && (undefined === input.minLength || "number" === typeof input.minLength) && (undefined === input.maxLength || "number" === typeof input.maxLength) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io36 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io28(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io37 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io28(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId) && ("object" === typeof input.thumb && null !== input.thumb && $io38(input.thumb)); }; var $io38 = function (input) { return "string" === typeof input.url && (undefined === input.dimensions || "object" === typeof input.dimensions && null !== input.dimensions && $io39(input.dimensions)); }; var $io39 = function (input) { return "number" === typeof input.width && "number" === typeof input.height; }; var $io40 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io28(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId) && ("object" === typeof input.preview && null !== input.preview && $io38(input.preview)) && (undefined === input.externalUrl || "string" === typeof input.externalUrl) && (undefined === input.oembedUrl || "string" === typeof input.oembedUrl) && (null !== input.thumb && undefined === input.thumb); }; var $io41 = function (input) { return "section" === input.type && (undefined === input.text || "object" === typeof input.text && null !== input.text && $iu3(input.text)) && (undefined === input.fields || Array.isArray(input.fields) && input.fields.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.accessory || "object" === typeof input.accessory && null !== input.accessory && $iu6(input.accessory)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io42 = function (input) { return "video_conf" === input.type && "string" === typeof input.callId && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io43 = function (input) { return "conditional" === input.type && (undefined === input.when || "object" === typeof input.when && null !== input.when && false === Array.isArray(input.when) && $io44(input.when)) && (Array.isArray(input.render) && input.render.every(function (elem) { return "object" === typeof elem && null !== elem && $iu4(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io44 = function (input) { return undefined === input.engine || Array.isArray(input.engine) && input.engine.every(function (elem) { return undefined === elem || "rocket.chat" === elem || "livechat" === elem; }); }; var $io45 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return "object" === typeof value && null !== value && false === Array.isArray(value) && $io46(value);
}); }; var $io46 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return true;
}); }; var $iu0 = function (input) { return (function () {
    if ("actions" === input.type)
        return $io3(input);
    else if ("callout" === input.type)
        return $io27(input);
    else if ("context" === input.type)
        return $io28(input);
    else if ("divider" === input.type)
        return $io30(input);
    else if ("tab_navigation" === input.type)
        return $io31(input);
    else if ("image" === input.type)
        return $io33(input);
    else if ("input" === input.type)
        return $io34(input);
    else if ("object" === typeof input.thumb && null !== input.thumb && $io38(input.thumb))
        return $io37(input);
    else if (undefined !== input.preview)
        return $io40(input);
    else if ("section" === input.type)
        return $io41(input);
    else if ("video_conf" === input.type)
        return $io42(input);
    else if ("conditional" === input.type)
        return $io43(input);
    else
        return $io36(input);
})(); }; var $iu1 = function (input) { return (function () {
    if ("button" === input.type)
        return $io4(input);
    else if ("channels_select" === input.type)
        return $io10(input);
    else if ("conversations_select" === input.type)
        return $io11(input);
    else if ("datepicker" === input.type)
        return $io12(input);
    else if ("linear_scale" === input.type)
        return $io13(input);
    else if ("multi_static_select" === input.type)
        return $io14(input);
    else if ("multi_channels_select" === input.type)
        return $io17(input);
    else if ("multi_conversations_select" === input.type)
        return $io18(input);
    else if ("multi_users_select" === input.type)
        return $io19(input);
    else if ("overflow" === input.type)
        return $io20(input);
    else if ("static_select" === input.type)
        return $io21(input);
    else if ("users_select" === input.type)
        return $io22(input);
    else if ("checkbox" === input.type)
        return $io24(input);
    else if ("toggle_switch" === input.type)
        return $io23(input);
    else if ("radio_button" === input.type)
        return $io25(input);
    else if ("time_picker" === input.type)
        return $io26(input);
    else
        return false;
})(); }; var $iu2 = function (input) { return (function () {
    if ("mrkdwn" === input.type)
        return $io9(input);
    else if ("plain_text" === input.type)
        return $io5(input);
    else if ("image" === input.type)
        return $io29(input);
    else
        return false;
})(); }; var $iu3 = function (input) { return (function () {
    if ("mrkdwn" === input.type)
        return $io9(input);
    else if ("plain_text" === input.type)
        return $io5(input);
    else
        return false;
})(); }; var $iu4 = function (input) { return (function () {
    if ("actions" === input.type)
        return $io3(input);
    else if ("callout" === input.type)
        return $io27(input);
    else if ("context" === input.type)
        return $io28(input);
    else if ("divider" === input.type)
        return $io30(input);
    else if ("tab_navigation" === input.type)
        return $io31(input);
    else if ("image" === input.type)
        return $io33(input);
    else if ("input" === input.type)
        return $io34(input);
    else if ("object" === typeof input.thumb && null !== input.thumb && $io38(input.thumb))
        return $io37(input);
    else if (undefined !== input.preview)
        return $io40(input);
    else if ("section" === input.type)
        return $io41(input);
    else if ("video_conf" === input.type)
        return $io42(input);
    else
        return $io36(input);
})(); }; var $iu5 = function (input) { return (function () {
    if ("channels_select" === input.type)
        return $io10(input);
    else if ("conversations_select" === input.type)
        return $io11(input);
    else if ("datepicker" === input.type)
        return $io12(input);
    else if ("linear_scale" === input.type)
        return $io13(input);
    else if ("multi_static_select" === input.type)
        return $io14(input);
    else if ("multi_channels_select" === input.type)
        return $io17(input);
    else if ("multi_conversations_select" === input.type)
        return $io18(input);
    else if ("multi_users_select" === input.type)
        return $io19(input);
    else if ("plain_text_input" === input.type)
        return $io35(input);
    else if ("static_select" === input.type)
        return $io21(input);
    else if ("users_select" === input.type)
        return $io22(input);
    else if ("checkbox" === input.type)
        return $io24(input);
    else if ("toggle_switch" === input.type)
        return $io23(input);
    else if ("radio_button" === input.type)
        return $io25(input);
    else if ("time_picker" === input.type)
        return $io26(input);
    else
        return false;
})(); }; var $iu6 = function (input) { return (function () {
    if ("button" === input.type)
        return $io4(input);
    else if ("datepicker" === input.type)
        return $io12(input);
    else if ("image" === input.type)
        return $io29(input);
    else if ("multi_static_select" === input.type)
        return $io14(input);
    else if ("overflow" === input.type)
        return $io20(input);
    else if ("static_select" === input.type)
        return $io21(input);
    else
        return false;
})(); }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isViewSubmitUserInteraction = (function () { var $io0 = function (input) { return "viewSubmit" === input.type && (null !== input.actionId && undefined === input.actionId) && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && "string" === typeof input.triggerId && "string" === typeof input.viewId; }; var $io1 = function (input) { return "object" === typeof input.view && null !== input.view && $io2(input.view); }; var $io2 = function (input) { return "string" === typeof input.appId && (Array.isArray(input.blocks) && input.blocks.every(function (elem) { return "object" === typeof elem && null !== elem && $iu0(elem); })) && "string" === typeof input.id && ("object" === typeof input.state && null !== input.state && false === Array.isArray(input.state) && $io45(input.state)); }; var $io3 = function (input) { return "actions" === input.type && (Array.isArray(input.elements) && input.elements.every(function (elem) { return "object" === typeof elem && null !== elem && $iu1(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io4 = function (input) { return "button" === input.type && ("object" === typeof input.text && null !== input.text && $io5(input.text)) && (undefined === input.url || "string" === typeof input.url) && (undefined === input.value || "string" === typeof input.value) && (undefined === input.style || "primary" === input.style || "danger" === input.style || "secondary" === input.style || "warning" === input.style || "success" === input.style) && (undefined === input.secondary || "boolean" === typeof input.secondary) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io5 = function (input) { return "plain_text" === input.type && "string" === typeof input.text && (undefined === input.emoji || "boolean" === typeof input.emoji) && (undefined === input.i18n || "object" === typeof input.i18n && null !== input.i18n && $io6(input.i18n)); }; var $io6 = function (input) { return "string" === typeof input.key && (undefined === input.args || "object" === typeof input.args && null !== input.args && false === Array.isArray(input.args) && $io7(input.args)); }; var $io7 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return "string" === typeof value || "number" === typeof value;
}); }; var $io8 = function (input) { return "object" === typeof input.title && null !== input.title && $io5(input.title) && ("object" === typeof input.text && null !== input.text && $iu3(input.text)) && ("object" === typeof input.confirm && null !== input.confirm && $io5(input.confirm)) && ("object" === typeof input.deny && null !== input.deny && $io5(input.deny)) && ("primary" === input.style || "danger" === input.style); }; var $io9 = function (input) { return "mrkdwn" === input.type && "string" === typeof input.text && (undefined === input.verbatim || "boolean" === typeof input.verbatim) && (undefined === input.i18n || "object" === typeof input.i18n && null !== input.i18n && $io6(input.i18n)); }; var $io10 = function (input) { return "channels_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io11 = function (input) { return "conversations_select" === input.type && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io12 = function (input) { return "datepicker" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (undefined === input.initialDate || "string" === typeof input.initialDate) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io13 = function (input) { return "linear_scale" === input.type && (undefined === input.minValue || "number" === typeof input.minValue) && (undefined === input.maxValue || "number" === typeof input.maxValue) && (undefined === input.initialValue || "number" === typeof input.initialValue) && (undefined === input.preLabel || "object" === typeof input.preLabel && null !== input.preLabel && $io5(input.preLabel)) && (undefined === input.postLabel || "object" === typeof input.postLabel && null !== input.postLabel && $io5(input.postLabel)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io14 = function (input) { return "multi_static_select" === input.type && ("object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.optionGroups || Array.isArray(input.optionGroups) && input.optionGroups.every(function (elem) { return "object" === typeof elem && null !== elem && $io16(elem); })) && (undefined === input.maxSelectItems || "number" === typeof input.maxSelectItems) && (undefined === input.initialValue || Array.isArray(input.initialValue) && input.initialValue.every(function (elem) { return "string" === typeof elem; })) && (undefined === input.initialOption || Array.isArray(input.initialOption) && input.initialOption.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io15 = function (input) { return "object" === typeof input.text && null !== input.text && $iu3(input.text) && "string" === typeof input.value && (undefined === input.description || "object" === typeof input.description && null !== input.description && $io5(input.description)) && (undefined === input.url || "string" === typeof input.url); }; var $io16 = function (input) { return "object" === typeof input.label && null !== input.label && $io5(input.label) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })); }; var $io17 = function (input) { return "multi_channels_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io18 = function (input) { return "multi_conversations_select" === input.type && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io19 = function (input) { return "multi_users_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io20 = function (input) { return "overflow" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io21 = function (input) { return "static_select" === input.type && ("object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.optionGroups || Array.isArray(input.optionGroups) && input.optionGroups.every(function (elem) { return "object" === typeof elem && null !== elem && $io16(elem); })) && (undefined === input.initialOption || "object" === typeof input.initialOption && null !== input.initialOption && $io15(input.initialOption)) && (undefined === input.initialValue || "string" === typeof input.initialValue) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io22 = function (input) { return "users_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io23 = function (input) { return "toggle_switch" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.initialOptions || Array.isArray(input.initialOptions) && input.initialOptions.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io24 = function (input) { return "checkbox" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.initialOptions || Array.isArray(input.initialOptions) && input.initialOptions.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io25 = function (input) { return "radio_button" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io15(elem); })) && (undefined === input.initialOption || "object" === typeof input.initialOption && null !== input.initialOption && $io15(input.initialOption)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io26 = function (input) { return "time_picker" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (undefined === input.initialTime || "string" === typeof input.initialTime) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io27 = function (input) { return "callout" === input.type && (undefined === input.title || "object" === typeof input.title && null !== input.title && $iu3(input.title)) && ("object" === typeof input.text && null !== input.text && $iu3(input.text)) && (undefined === input.variant || "danger" === input.variant || "warning" === input.variant || "success" === input.variant || "info" === input.variant) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io28 = function (input) { return "context" === input.type && (Array.isArray(input.elements) && input.elements.every(function (elem) { return "object" === typeof elem && null !== elem && $iu2(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io29 = function (input) { return "image" === input.type && "string" === typeof input.imageUrl && "string" === typeof input.altText; }; var $io30 = function (input) { return "divider" === input.type && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io31 = function (input) { return "tab_navigation" === input.type && (Array.isArray(input.tabs) && input.tabs.every(function (elem) { return "object" === typeof elem && null !== elem && $io32(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io32 = function (input) { return "tab" === input.type && ("object" === typeof input.title && null !== input.title && $iu3(input.title)) && (undefined === input.disabled || "boolean" === typeof input.disabled) && (undefined === input.selected || "boolean" === typeof input.selected) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io33 = function (input) { return "image" === input.type && "string" === typeof input.imageUrl && "string" === typeof input.altText && (undefined === input.title || "object" === typeof input.title && null !== input.title && $io5(input.title)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io34 = function (input) { return "input" === input.type && ("object" === typeof input.label && null !== input.label && $io5(input.label)) && ("object" === typeof input.element && null !== input.element && $iu5(input.element)) && (undefined === input.hint || "object" === typeof input.hint && null !== input.hint && $io5(input.hint)) && (undefined === input.optional || "boolean" === typeof input.optional) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io35 = function (input) { return "plain_text_input" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io5(input.placeholder)) && (undefined === input.initialValue || "string" === typeof input.initialValue) && (undefined === input.multiline || "boolean" === typeof input.multiline) && (undefined === input.minLength || "number" === typeof input.minLength) && (undefined === input.maxLength || "number" === typeof input.maxLength) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io8(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io36 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io28(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io37 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io28(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId) && ("object" === typeof input.thumb && null !== input.thumb && $io38(input.thumb)); }; var $io38 = function (input) { return "string" === typeof input.url && (undefined === input.dimensions || "object" === typeof input.dimensions && null !== input.dimensions && $io39(input.dimensions)); }; var $io39 = function (input) { return "number" === typeof input.width && "number" === typeof input.height; }; var $io40 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io28(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId) && ("object" === typeof input.preview && null !== input.preview && $io38(input.preview)) && (undefined === input.externalUrl || "string" === typeof input.externalUrl) && (undefined === input.oembedUrl || "string" === typeof input.oembedUrl) && (null !== input.thumb && undefined === input.thumb); }; var $io41 = function (input) { return "section" === input.type && (undefined === input.text || "object" === typeof input.text && null !== input.text && $iu3(input.text)) && (undefined === input.fields || Array.isArray(input.fields) && input.fields.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.accessory || "object" === typeof input.accessory && null !== input.accessory && $iu6(input.accessory)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io42 = function (input) { return "video_conf" === input.type && "string" === typeof input.callId && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io43 = function (input) { return "conditional" === input.type && (undefined === input.when || "object" === typeof input.when && null !== input.when && false === Array.isArray(input.when) && $io44(input.when)) && (Array.isArray(input.render) && input.render.every(function (elem) { return "object" === typeof elem && null !== elem && $iu4(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io44 = function (input) { return undefined === input.engine || Array.isArray(input.engine) && input.engine.every(function (elem) { return undefined === elem || "rocket.chat" === elem || "livechat" === elem; }); }; var $io45 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return "object" === typeof value && null !== value && false === Array.isArray(value) && $io46(value);
}); }; var $io46 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return true;
}); }; var $iu0 = function (input) { return (function () {
    if ("actions" === input.type)
        return $io3(input);
    else if ("callout" === input.type)
        return $io27(input);
    else if ("context" === input.type)
        return $io28(input);
    else if ("divider" === input.type)
        return $io30(input);
    else if ("tab_navigation" === input.type)
        return $io31(input);
    else if ("image" === input.type)
        return $io33(input);
    else if ("input" === input.type)
        return $io34(input);
    else if ("object" === typeof input.thumb && null !== input.thumb && $io38(input.thumb))
        return $io37(input);
    else if (undefined !== input.preview)
        return $io40(input);
    else if ("section" === input.type)
        return $io41(input);
    else if ("video_conf" === input.type)
        return $io42(input);
    else if ("conditional" === input.type)
        return $io43(input);
    else
        return $io36(input);
})(); }; var $iu1 = function (input) { return (function () {
    if ("button" === input.type)
        return $io4(input);
    else if ("channels_select" === input.type)
        return $io10(input);
    else if ("conversations_select" === input.type)
        return $io11(input);
    else if ("datepicker" === input.type)
        return $io12(input);
    else if ("linear_scale" === input.type)
        return $io13(input);
    else if ("multi_static_select" === input.type)
        return $io14(input);
    else if ("multi_channels_select" === input.type)
        return $io17(input);
    else if ("multi_conversations_select" === input.type)
        return $io18(input);
    else if ("multi_users_select" === input.type)
        return $io19(input);
    else if ("overflow" === input.type)
        return $io20(input);
    else if ("static_select" === input.type)
        return $io21(input);
    else if ("users_select" === input.type)
        return $io22(input);
    else if ("checkbox" === input.type)
        return $io24(input);
    else if ("toggle_switch" === input.type)
        return $io23(input);
    else if ("radio_button" === input.type)
        return $io25(input);
    else if ("time_picker" === input.type)
        return $io26(input);
    else
        return false;
})(); }; var $iu2 = function (input) { return (function () {
    if ("mrkdwn" === input.type)
        return $io9(input);
    else if ("plain_text" === input.type)
        return $io5(input);
    else if ("image" === input.type)
        return $io29(input);
    else
        return false;
})(); }; var $iu3 = function (input) { return (function () {
    if ("mrkdwn" === input.type)
        return $io9(input);
    else if ("plain_text" === input.type)
        return $io5(input);
    else
        return false;
})(); }; var $iu4 = function (input) { return (function () {
    if ("actions" === input.type)
        return $io3(input);
    else if ("callout" === input.type)
        return $io27(input);
    else if ("context" === input.type)
        return $io28(input);
    else if ("divider" === input.type)
        return $io30(input);
    else if ("tab_navigation" === input.type)
        return $io31(input);
    else if ("image" === input.type)
        return $io33(input);
    else if ("input" === input.type)
        return $io34(input);
    else if ("object" === typeof input.thumb && null !== input.thumb && $io38(input.thumb))
        return $io37(input);
    else if (undefined !== input.preview)
        return $io40(input);
    else if ("section" === input.type)
        return $io41(input);
    else if ("video_conf" === input.type)
        return $io42(input);
    else
        return $io36(input);
})(); }; var $iu5 = function (input) { return (function () {
    if ("channels_select" === input.type)
        return $io10(input);
    else if ("conversations_select" === input.type)
        return $io11(input);
    else if ("datepicker" === input.type)
        return $io12(input);
    else if ("linear_scale" === input.type)
        return $io13(input);
    else if ("multi_static_select" === input.type)
        return $io14(input);
    else if ("multi_channels_select" === input.type)
        return $io17(input);
    else if ("multi_conversations_select" === input.type)
        return $io18(input);
    else if ("multi_users_select" === input.type)
        return $io19(input);
    else if ("plain_text_input" === input.type)
        return $io35(input);
    else if ("static_select" === input.type)
        return $io21(input);
    else if ("users_select" === input.type)
        return $io22(input);
    else if ("checkbox" === input.type)
        return $io24(input);
    else if ("toggle_switch" === input.type)
        return $io23(input);
    else if ("radio_button" === input.type)
        return $io25(input);
    else if ("time_picker" === input.type)
        return $io26(input);
    else
        return false;
})(); }; var $iu6 = function (input) { return (function () {
    if ("button" === input.type)
        return $io4(input);
    else if ("datepicker" === input.type)
        return $io12(input);
    else if ("image" === input.type)
        return $io29(input);
    else if ("multi_static_select" === input.type)
        return $io14(input);
    else if ("overflow" === input.type)
        return $io20(input);
    else if ("static_select" === input.type)
        return $io21(input);
    else
        return false;
})(); }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isMessageBoxActionButtonUserInteraction = (function () { var $io0 = function (input) { return "actionButton" === input.type && "string" === typeof input.actionId && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && (null !== input.mid && undefined === input.mid) && (undefined === input.tmid || "string" === typeof input.tmid) && "string" === typeof input.rid && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "messageBoxAction" === input.context && "string" === typeof input.message; }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isUserDropdownActionButtonUserInteraction = (function () { var $io0 = function (input) { return "actionButton" === input.type && "string" === typeof input.actionId && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && (null !== input.mid && undefined === input.mid) && (null !== input.tmid && undefined === input.tmid) && (null !== input.rid && undefined === input.rid) && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "userDropdownAction" === input.context && (null !== input.message && undefined === input.message); }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isMesssageActionButtonUserInteraction = (function () { var $io0 = function (input) { return "actionButton" === input.type && "string" === typeof input.actionId && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && "string" === typeof input.mid && (undefined === input.tmid || "string" === typeof input.tmid) && "string" === typeof input.rid && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "messageAction" === input.context && (null !== input.message && undefined === input.message); }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
exports.isRoomActionButtonUserInteraction = (function () { var $io0 = function (input) { return "actionButton" === input.type && "string" === typeof input.actionId && ("object" === typeof input.payload && null !== input.payload && $io1(input.payload)) && (null !== input.mid && undefined === input.mid) && (null !== input.tmid && undefined === input.tmid) && "string" === typeof input.rid && "string" === typeof input.triggerId; }; var $io1 = function (input) { return "roomAction" === input.context && (null !== input.message && undefined === input.message); }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
//# sourceMappingURL=UserInteraction.js.map