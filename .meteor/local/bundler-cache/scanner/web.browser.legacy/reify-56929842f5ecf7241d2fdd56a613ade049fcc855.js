"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTextObject = void 0;
var getTextObjectRenderer = function (renderers, type) {
    var _a;
    var renderer = renderers[type];
    if (renderer) {
        return renderer;
    }
    switch (type) {
        case 'plain_text':
            return ((_a = renderers.plainText) !== null && _a !== void 0 ? _a : renderers.text);
        case 'mrkdwn':
            return renderers.text;
    }
};
var renderTextObject = function (renderers, context) {
    return function (textObject, index) {
        var renderer = getTextObjectRenderer(renderers, textObject.type);
        if (!renderer) {
            return null;
        }
        return renderer.call(renderers, textObject, context, index);
    };
};
exports.renderTextObject = renderTextObject;
//# sourceMappingURL=renderTextObject.js.map