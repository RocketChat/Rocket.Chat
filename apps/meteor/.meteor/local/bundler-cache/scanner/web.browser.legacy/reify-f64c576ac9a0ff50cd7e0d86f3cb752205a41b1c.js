"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const react_1 = require("react");
const useSurfaceType_1 = require("../hooks/useSurfaceType");
const ImageBlock_styles_1 = require("./ImageBlock.styles");
const maxSize = 360;
const fetchImageState = (img) => {
    if (!img.complete) {
        return {
            loading: true,
            width: maxSize,
            height: (maxSize * 9) / 21,
        };
    }
    const { naturalWidth, naturalHeight } = img;
    const scaleRatio = naturalWidth > naturalHeight
        ? Math.min(naturalWidth, maxSize) / naturalWidth
        : Math.min(naturalHeight, maxSize) / naturalHeight;
    return {
        loading: false,
        width: naturalWidth * scaleRatio,
        height: naturalHeight * scaleRatio,
    };
};
const ImageBlock = ({ className, block, surfaceRenderer, }) => {
    const surface = (0, useSurfaceType_1.useSurfaceType)();
    const alignment = surface === 'banner' || surface === 'message' ? 'flex-start' : 'center';
    const [{ loading, width, height }, setState] = (0, react_1.useState)(() => {
        const img = document.createElement('img');
        img.src = block.imageUrl;
        return fetchImageState(img);
    });
    (0, react_1.useEffect)(() => {
        const img = document.createElement('img');
        const handleLoad = () => {
            setState(fetchImageState(img));
        };
        img.addEventListener('load', handleLoad);
        img.src = block.imageUrl;
        if (img.complete) {
            img.removeEventListener('load', handleLoad);
            setState(fetchImageState(img));
        }
        return () => {
            img.removeEventListener('load', handleLoad);
        };
    }, [block.imageUrl]);
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { className: className, display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', alignItems: alignment, children: (0, jsx_runtime_1.jsxs)(fuselage_1.Box, { overflow: 'hidden', width: width, children: [block.title && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { fontScale: 'c1', color: 'hint', withTruncatedText: true, marginBlockEnd: 4, children: surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE) })), loading ? ((0, jsx_runtime_1.jsx)(fuselage_1.Skeleton, { variant: 'rect', width: width, height: height })) : ((0, jsx_runtime_1.jsx)(ImageBlock_styles_1.Image, { imageUrl: block.imageUrl, width: width, height: height, "aria-label": block.altText }))] }) }));
};
exports.default = (0, react_1.memo)(ImageBlock);
//# sourceMappingURL=ImageBlock.js.map