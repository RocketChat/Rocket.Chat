import BannerSurface from './BannerSurface';
import { BannerSurfaceRenderer } from './BannerSurfaceRenderer';
import ContextualBarSurface from './ContextualBarSurface';
import { ContextualBarSurfaceRenderer } from './ContextualBarSurfaceRenderer';
import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';
import ModalSurface from './ModalSurface';
import { ModalSurfaceRenderer } from './ModalSurfaceRenderer';
import { Surface } from './Surface';
import { UiKitMessage, messageParser } from './UiKitMessage';
import { createSurfaceRenderer } from './createSurfaceRenderer';

export const bannerParser = new BannerSurfaceRenderer();
export const modalParser = new ModalSurfaceRenderer();
export const contextualBarParser = new ContextualBarSurfaceRenderer();

export const UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
export const UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
export const UiKitContextualBar = createSurfaceRenderer(ContextualBarSurface, contextualBarParser);

export { UiKitMessage, messageParser, createSurfaceRenderer, Surface, FuselageSurfaceRenderer, renderTextObject };
