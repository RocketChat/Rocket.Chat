module.export({isView:()=>isView});let typia;module.link('typia',{default(v){typia=v}},0);
var isView = (function () { var $io0 = function (input) { return "string" === typeof input.appId && (Array.isArray(input.blocks) && input.blocks.every(function (elem) { return "object" === typeof elem && null !== elem && $iu0(elem); })); }; var $io1 = function (input) { return "actions" === input.type && (Array.isArray(input.elements) && input.elements.every(function (elem) { return "object" === typeof elem && null !== elem && $iu1(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io2 = function (input) { return "button" === input.type && ("object" === typeof input.text && null !== input.text && $io3(input.text)) && (undefined === input.url || "string" === typeof input.url) && (undefined === input.value || "string" === typeof input.value) && (undefined === input.style || "primary" === input.style || "danger" === input.style || "secondary" === input.style || "warning" === input.style || "success" === input.style) && (undefined === input.secondary || "boolean" === typeof input.secondary) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io3 = function (input) { return "plain_text" === input.type && "string" === typeof input.text && (undefined === input.emoji || "boolean" === typeof input.emoji) && (undefined === input.i18n || "object" === typeof input.i18n && null !== input.i18n && $io4(input.i18n)); }; var $io4 = function (input) { return "string" === typeof input.key && (undefined === input.args || "object" === typeof input.args && null !== input.args && false === Array.isArray(input.args) && $io5(input.args)); }; var $io5 = function (input) { return Object.keys(input).every(function (key) {
    var value = input[key];
    if (undefined === value)
        return true;
    return "string" === typeof value || "number" === typeof value;
}); }; var $io6 = function (input) { return "object" === typeof input.title && null !== input.title && $io3(input.title) && ("object" === typeof input.text && null !== input.text && $iu3(input.text)) && ("object" === typeof input.confirm && null !== input.confirm && $io3(input.confirm)) && ("object" === typeof input.deny && null !== input.deny && $io3(input.deny)) && ("primary" === input.style || "danger" === input.style); }; var $io7 = function (input) { return "mrkdwn" === input.type && "string" === typeof input.text && (undefined === input.verbatim || "boolean" === typeof input.verbatim) && (undefined === input.i18n || "object" === typeof input.i18n && null !== input.i18n && $io4(input.i18n)); }; var $io8 = function (input) { return "channels_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io3(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io9 = function (input) { return "conversations_select" === input.type && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io10 = function (input) { return "datepicker" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (undefined === input.initialDate || "string" === typeof input.initialDate) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io11 = function (input) { return "linear_scale" === input.type && (undefined === input.minValue || "number" === typeof input.minValue) && (undefined === input.maxValue || "number" === typeof input.maxValue) && (undefined === input.initialValue || "number" === typeof input.initialValue) && (undefined === input.preLabel || "object" === typeof input.preLabel && null !== input.preLabel && $io3(input.preLabel)) && (undefined === input.postLabel || "object" === typeof input.postLabel && null !== input.postLabel && $io3(input.postLabel)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io12 = function (input) { return "multi_static_select" === input.type && ("object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && (undefined === input.optionGroups || Array.isArray(input.optionGroups) && input.optionGroups.every(function (elem) { return "object" === typeof elem && null !== elem && $io14(elem); })) && (undefined === input.maxSelectItems || "number" === typeof input.maxSelectItems) && (undefined === input.initialValue || Array.isArray(input.initialValue) && input.initialValue.every(function (elem) { return "string" === typeof elem; })) && (undefined === input.initialOption || Array.isArray(input.initialOption) && input.initialOption.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io13 = function (input) { return "object" === typeof input.text && null !== input.text && $iu3(input.text) && "string" === typeof input.value && (undefined === input.description || "object" === typeof input.description && null !== input.description && $io3(input.description)) && (undefined === input.url || "string" === typeof input.url); }; var $io14 = function (input) { return "object" === typeof input.label && null !== input.label && $io3(input.label) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })); }; var $io15 = function (input) { return "multi_channels_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io3(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io16 = function (input) { return "multi_conversations_select" === input.type && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io17 = function (input) { return "multi_users_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io3(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io18 = function (input) { return "overflow" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io19 = function (input) { return "static_select" === input.type && ("object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && (undefined === input.optionGroups || Array.isArray(input.optionGroups) && input.optionGroups.every(function (elem) { return "object" === typeof elem && null !== elem && $io14(elem); })) && (undefined === input.initialOption || "object" === typeof input.initialOption && null !== input.initialOption && $io13(input.initialOption)) && (undefined === input.initialValue || "string" === typeof input.initialValue) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io20 = function (input) { return "users_select" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io3(input.placeholder)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io21 = function (input) { return "toggle_switch" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && (undefined === input.initialOptions || Array.isArray(input.initialOptions) && input.initialOptions.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io22 = function (input) { return "checkbox" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && (undefined === input.initialOptions || Array.isArray(input.initialOptions) && input.initialOptions.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io23 = function (input) { return "radio_button" === input.type && (Array.isArray(input.options) && input.options.every(function (elem) { return "object" === typeof elem && null !== elem && $io13(elem); })) && (undefined === input.initialOption || "object" === typeof input.initialOption && null !== input.initialOption && $io13(input.initialOption)) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io24 = function (input) { return "time_picker" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $iu3(input.placeholder)) && (undefined === input.initialTime || "string" === typeof input.initialTime) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io25 = function (input) { return "callout" === input.type && (undefined === input.title || "object" === typeof input.title && null !== input.title && $iu3(input.title)) && ("object" === typeof input.text && null !== input.text && $iu3(input.text)) && (undefined === input.variant || "danger" === input.variant || "warning" === input.variant || "success" === input.variant || "info" === input.variant) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io26 = function (input) { return "context" === input.type && (Array.isArray(input.elements) && input.elements.every(function (elem) { return "object" === typeof elem && null !== elem && $iu2(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io27 = function (input) { return "image" === input.type && "string" === typeof input.imageUrl && "string" === typeof input.altText; }; var $io28 = function (input) { return "divider" === input.type && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io29 = function (input) { return "tab_navigation" === input.type && (Array.isArray(input.tabs) && input.tabs.every(function (elem) { return "object" === typeof elem && null !== elem && $io30(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io30 = function (input) { return "tab" === input.type && ("object" === typeof input.title && null !== input.title && $iu3(input.title)) && (undefined === input.disabled || "boolean" === typeof input.disabled) && (undefined === input.selected || "boolean" === typeof input.selected) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io31 = function (input) { return "image" === input.type && "string" === typeof input.imageUrl && "string" === typeof input.altText && (undefined === input.title || "object" === typeof input.title && null !== input.title && $io3(input.title)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io32 = function (input) { return "input" === input.type && ("object" === typeof input.label && null !== input.label && $io3(input.label)) && ("object" === typeof input.element && null !== input.element && $iu5(input.element)) && (undefined === input.hint || "object" === typeof input.hint && null !== input.hint && $io3(input.hint)) && (undefined === input.optional || "boolean" === typeof input.optional) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io33 = function (input) { return "plain_text_input" === input.type && (undefined === input.placeholder || "object" === typeof input.placeholder && null !== input.placeholder && $io3(input.placeholder)) && (undefined === input.initialValue || "string" === typeof input.initialValue) && (undefined === input.multiline || "boolean" === typeof input.multiline) && (undefined === input.minLength || "number" === typeof input.minLength) && (undefined === input.maxLength || "number" === typeof input.maxLength) && "string" === typeof input.appId && "string" === typeof input.blockId && "string" === typeof input.actionId && (undefined === input.confirm || "object" === typeof input.confirm && null !== input.confirm && $io6(input.confirm)) && (undefined === input.dispatchActionConfig || Array.isArray(input.dispatchActionConfig) && input.dispatchActionConfig.every(function (elem) { return "on_character_entered" === elem || "on_item_selected" === elem; })); }; var $io34 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io26(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io35 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io26(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId) && ("object" === typeof input.thumb && null !== input.thumb && $io36(input.thumb)); }; var $io36 = function (input) { return "string" === typeof input.url && (undefined === input.dimensions || "object" === typeof input.dimensions && null !== input.dimensions && $io37(input.dimensions)); }; var $io37 = function (input) { return "number" === typeof input.width && "number" === typeof input.height; }; var $io38 = function (input) { return "preview" === input.type && (Array.isArray(input.title) && input.title.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (Array.isArray(input.description) && input.description.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.footer || "object" === typeof input.footer && null !== input.footer && $io26(input.footer)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId) && ("object" === typeof input.preview && null !== input.preview && $io36(input.preview)) && (undefined === input.externalUrl || "string" === typeof input.externalUrl) && (undefined === input.oembedUrl || "string" === typeof input.oembedUrl) && (null !== input.thumb && undefined === input.thumb); }; var $io39 = function (input) { return "section" === input.type && (undefined === input.text || "object" === typeof input.text && null !== input.text && $iu3(input.text)) && (undefined === input.fields || Array.isArray(input.fields) && input.fields.every(function (elem) { return "object" === typeof elem && null !== elem && $iu3(elem); })) && (undefined === input.accessory || "object" === typeof input.accessory && null !== input.accessory && $iu6(input.accessory)) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io40 = function (input) { return "video_conf" === input.type && "string" === typeof input.callId && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io41 = function (input) { return "conditional" === input.type && (undefined === input.when || "object" === typeof input.when && null !== input.when && false === Array.isArray(input.when) && $io42(input.when)) && (Array.isArray(input.render) && input.render.every(function (elem) { return "object" === typeof elem && null !== elem && $iu4(elem); })) && (undefined === input.appId || "string" === typeof input.appId) && (undefined === input.blockId || "string" === typeof input.blockId); }; var $io42 = function (input) { return undefined === input.engine || Array.isArray(input.engine) && input.engine.every(function (elem) { return undefined === elem || "rocket.chat" === elem || "livechat" === elem; }); }; var $iu0 = function (input) { return (function () {
    if ("actions" === input.type)
        return $io1(input);
    else if ("callout" === input.type)
        return $io25(input);
    else if ("context" === input.type)
        return $io26(input);
    else if ("divider" === input.type)
        return $io28(input);
    else if ("tab_navigation" === input.type)
        return $io29(input);
    else if ("image" === input.type)
        return $io31(input);
    else if ("input" === input.type)
        return $io32(input);
    else if ("object" === typeof input.thumb && null !== input.thumb && $io36(input.thumb))
        return $io35(input);
    else if (undefined !== input.preview)
        return $io38(input);
    else if ("section" === input.type)
        return $io39(input);
    else if ("video_conf" === input.type)
        return $io40(input);
    else if ("conditional" === input.type)
        return $io41(input);
    else
        return $io34(input);
})(); }; var $iu1 = function (input) { return (function () {
    if ("button" === input.type)
        return $io2(input);
    else if ("channels_select" === input.type)
        return $io8(input);
    else if ("conversations_select" === input.type)
        return $io9(input);
    else if ("datepicker" === input.type)
        return $io10(input);
    else if ("linear_scale" === input.type)
        return $io11(input);
    else if ("multi_static_select" === input.type)
        return $io12(input);
    else if ("multi_channels_select" === input.type)
        return $io15(input);
    else if ("multi_conversations_select" === input.type)
        return $io16(input);
    else if ("multi_users_select" === input.type)
        return $io17(input);
    else if ("overflow" === input.type)
        return $io18(input);
    else if ("static_select" === input.type)
        return $io19(input);
    else if ("users_select" === input.type)
        return $io20(input);
    else if ("checkbox" === input.type)
        return $io22(input);
    else if ("toggle_switch" === input.type)
        return $io21(input);
    else if ("radio_button" === input.type)
        return $io23(input);
    else if ("time_picker" === input.type)
        return $io24(input);
    else
        return false;
})(); }; var $iu2 = function (input) { return (function () {
    if ("mrkdwn" === input.type)
        return $io7(input);
    else if ("plain_text" === input.type)
        return $io3(input);
    else if ("image" === input.type)
        return $io27(input);
    else
        return false;
})(); }; var $iu3 = function (input) { return (function () {
    if ("mrkdwn" === input.type)
        return $io7(input);
    else if ("plain_text" === input.type)
        return $io3(input);
    else
        return false;
})(); }; var $iu4 = function (input) { return (function () {
    if ("actions" === input.type)
        return $io1(input);
    else if ("callout" === input.type)
        return $io25(input);
    else if ("context" === input.type)
        return $io26(input);
    else if ("divider" === input.type)
        return $io28(input);
    else if ("tab_navigation" === input.type)
        return $io29(input);
    else if ("image" === input.type)
        return $io31(input);
    else if ("input" === input.type)
        return $io32(input);
    else if ("object" === typeof input.thumb && null !== input.thumb && $io36(input.thumb))
        return $io35(input);
    else if (undefined !== input.preview)
        return $io38(input);
    else if ("section" === input.type)
        return $io39(input);
    else if ("video_conf" === input.type)
        return $io40(input);
    else
        return $io34(input);
})(); }; var $iu5 = function (input) { return (function () {
    if ("channels_select" === input.type)
        return $io8(input);
    else if ("conversations_select" === input.type)
        return $io9(input);
    else if ("datepicker" === input.type)
        return $io10(input);
    else if ("linear_scale" === input.type)
        return $io11(input);
    else if ("multi_static_select" === input.type)
        return $io12(input);
    else if ("multi_channels_select" === input.type)
        return $io15(input);
    else if ("multi_conversations_select" === input.type)
        return $io16(input);
    else if ("multi_users_select" === input.type)
        return $io17(input);
    else if ("plain_text_input" === input.type)
        return $io33(input);
    else if ("static_select" === input.type)
        return $io19(input);
    else if ("users_select" === input.type)
        return $io20(input);
    else if ("checkbox" === input.type)
        return $io22(input);
    else if ("toggle_switch" === input.type)
        return $io21(input);
    else if ("radio_button" === input.type)
        return $io23(input);
    else if ("time_picker" === input.type)
        return $io24(input);
    else
        return false;
})(); }; var $iu6 = function (input) { return (function () {
    if ("button" === input.type)
        return $io2(input);
    else if ("datepicker" === input.type)
        return $io10(input);
    else if ("image" === input.type)
        return $io27(input);
    else if ("multi_static_select" === input.type)
        return $io12(input);
    else if ("overflow" === input.type)
        return $io18(input);
    else if ("static_select" === input.type)
        return $io19(input);
    else
        return false;
})(); }; return function (input) { return "object" === typeof input && null !== input && $io0(input); }; })();
//# sourceMappingURL=View.js.map