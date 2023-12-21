import BannerSurface from './BannerSurface';
import { BannerSurfaceRenderer } from './BannerSurfaceRenderer';
import ContextualBarSurface from './ContextualBarSurface';
import { ContextualBarSurfaceRenderer } from './ContextualBarSurfaceRenderer';
import { FuselageMessageSurfaceRenderer } from './FuselageMessageSurfaceRenderer';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { ModalSurfaceRenderer } from './ModalSurfaceRenderer';
import { createSurfaceRenderer } from './createSurfaceRenderer';

export const bannerParser = new BannerSurfaceRenderer();
export const messageParser = new FuselageMessageSurfaceRenderer();
export const modalParser = new ModalSurfaceRenderer();
export const contextualBarParser = new ContextualBarSurfaceRenderer();

export const UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
export const UiKitMessage = createSurfaceRenderer(
  MessageSurface,
  messageParser
);
export const UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
export const UiKitContextualBar = createSurfaceRenderer(
  ContextualBarSurface,
  contextualBarParser
);
