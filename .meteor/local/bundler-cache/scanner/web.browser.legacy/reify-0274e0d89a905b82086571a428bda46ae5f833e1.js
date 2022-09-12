"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fuselage_1 = require("@rocket.chat/fuselage");
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = __importStar(require("react"));
var SurfaceContext_1 = require("../contexts/SurfaceContext");
var ImageBlock_styles_1 = require("./ImageBlock.styles");
var maxSize = 360;
var fetchImageState = function (img) {
    if (!img.complete) {
        return {
            loading: true,
            width: maxSize,
            height: (maxSize * 9) / 21,
        };
    }
    var naturalWidth = img.naturalWidth, naturalHeight = img.naturalHeight;
    var scaleRatio = naturalWidth > naturalHeight
        ? Math.min(naturalWidth, maxSize) / naturalWidth
        : Math.min(naturalHeight, maxSize) / naturalHeight;
    return {
        loading: false,
        width: naturalWidth * scaleRatio,
        height: naturalHeight * scaleRatio,
    };
};
var ImageBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var surface = SurfaceContext_1.useSurfaceType();
    var alignment = surface === 'banner' || surface === 'message' ? 'flex-start' : 'center';
    var _b = react_1.useState(function () {
        var img = document.createElement('img');
        img.src = block.imageUrl;
        return fetchImageState(img);
    }), _c = _b[0], loading = _c.loading, width = _c.width, height = _c.height, setState = _b[1];
    react_1.useEffect(function () {
        var img = document.createElement('img');
        var handleLoad = function () {
            setState(fetchImageState(img));
        };
        img.addEventListener('load', handleLoad);
        img.src = block.imageUrl;
        if (img.complete) {
            img.removeEventListener('load', handleLoad);
            setState(fetchImageState(img));
        }
        return function () {
            img.removeEventListener('load', handleLoad);
        };
    }, [block.imageUrl]);
    return (react_1.default.createElement(fuselage_1.Box, { className: className, display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', alignItems: alignment },
        react_1.default.createElement(fuselage_1.Box, { overflow: 'hidden', width: width },
            block.title && (react_1.default.createElement(fuselage_1.Box, { fontScale: 'c1', color: 'info', withTruncatedText: true, marginBlockEnd: 4 }, surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE))),
            loading ? (react_1.default.createElement(fuselage_1.Skeleton, { variant: 'rect', width: width, height: height })) : (react_1.default.createElement(ImageBlock_styles_1.Image, { imageUrl: block.imageUrl, width: width, height: height, "aria-label": block.altText })))));
};
exports.default = react_1.memo(ImageBlock);
//# sourceMappingURL=ImageBlock.js.map