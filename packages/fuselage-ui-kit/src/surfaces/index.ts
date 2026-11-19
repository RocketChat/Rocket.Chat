import BannerSurface from './BannerSurface.js';
import { BannerSurfaceRenderer } from './BannerSurfaceRenderer.js';
import ContextualBarSurface from './ContextualBarSurface.js';
import { ContextualBarSurfaceRenderer } from './ContextualBarSurfaceRenderer.js';
import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer.js';
import ModalSurface from './ModalSurface.js';
import { ModalSurfaceRenderer } from './ModalSurfaceRenderer.js';
import { Surface } from './Surface.js';
import { UiKitMessage, messageParser } from './UiKitMessage.js';
import { createSurfaceRenderer } from './createSurfaceRenderer.js';

export const bannerParser = new BannerSurfaceRenderer();
export const modalParser = new ModalSurfaceRenderer();
export const contextualBarParser = new ContextualBarSurfaceRenderer();

export const UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
export const UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
export const UiKitContextualBar = createSurfaceRenderer(ContextualBarSurface, contextualBarParser);

export { UiKitMessage, messageParser, createSurfaceRenderer, Surface, FuselageSurfaceRenderer, renderTextObject };
