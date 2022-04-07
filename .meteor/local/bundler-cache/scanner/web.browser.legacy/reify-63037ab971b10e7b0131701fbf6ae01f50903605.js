"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiKitModal = exports.UiKitMessage = exports.UiKitBanner = exports.modalParser = exports.messageParser = exports.bannerParser = void 0;
var BannerSurface_1 = __importDefault(require("./BannerSurface"));
var FuselageSurfaceRenderer_1 = require("./FuselageSurfaceRenderer");
var MessageSurface_1 = __importDefault(require("./MessageSurface"));
var ModalSurface_1 = __importDefault(require("./ModalSurface"));
var createSurfaceRenderer_1 = require("./createSurfaceRenderer");
// export const attachmentParser = new FuselageSurfaceRenderer();
exports.bannerParser = new FuselageSurfaceRenderer_1.FuselageSurfaceRenderer();
exports.messageParser = new FuselageSurfaceRenderer_1.FuselageSurfaceRenderer();
exports.modalParser = new FuselageSurfaceRenderer_1.FuselageSurfaceRenderer();
// export const UiKitAttachment = createSurfaceRenderer(AttachmentSurface, attachmentParser);
exports.UiKitBanner = createSurfaceRenderer_1.createSurfaceRenderer(BannerSurface_1.default, exports.bannerParser);
exports.UiKitMessage = createSurfaceRenderer_1.createSurfaceRenderer(MessageSurface_1.default, exports.messageParser);
exports.UiKitModal = createSurfaceRenderer_1.createSurfaceRenderer(ModalSurface_1.default, exports.modalParser);
//# sourceMappingURL=index.js.map