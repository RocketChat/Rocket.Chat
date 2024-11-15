"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiKitContextualBar = exports.UiKitModal = exports.UiKitMessage = exports.UiKitBanner = exports.contextualBarParser = exports.modalParser = exports.messageParser = exports.bannerParser = void 0;
const BannerSurface_1 = __importDefault(require("./BannerSurface"));
const BannerSurfaceRenderer_1 = require("./BannerSurfaceRenderer");
const ContextualBarSurface_1 = __importDefault(require("./ContextualBarSurface"));
const ContextualBarSurfaceRenderer_1 = require("./ContextualBarSurfaceRenderer");
const FuselageMessageSurfaceRenderer_1 = require("./FuselageMessageSurfaceRenderer");
const MessageSurface_1 = __importDefault(require("./MessageSurface"));
const ModalSurface_1 = __importDefault(require("./ModalSurface"));
const ModalSurfaceRenderer_1 = require("./ModalSurfaceRenderer");
const createSurfaceRenderer_1 = require("./createSurfaceRenderer");
exports.bannerParser = new BannerSurfaceRenderer_1.BannerSurfaceRenderer();
exports.messageParser = new FuselageMessageSurfaceRenderer_1.FuselageMessageSurfaceRenderer();
exports.modalParser = new ModalSurfaceRenderer_1.ModalSurfaceRenderer();
exports.contextualBarParser = new ContextualBarSurfaceRenderer_1.ContextualBarSurfaceRenderer();
exports.UiKitBanner = (0, createSurfaceRenderer_1.createSurfaceRenderer)(BannerSurface_1.default, exports.bannerParser);
exports.UiKitMessage = (0, createSurfaceRenderer_1.createSurfaceRenderer)(MessageSurface_1.default, exports.messageParser);
exports.UiKitModal = (0, createSurfaceRenderer_1.createSurfaceRenderer)(ModalSurface_1.default, exports.modalParser);
exports.UiKitContextualBar = (0, createSurfaceRenderer_1.createSurfaceRenderer)(ContextualBarSurface_1.default, exports.contextualBarParser);
//# sourceMappingURL=index.js.map