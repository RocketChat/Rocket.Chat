import BannerSurface from './BannerSurface';
import { BannerSurfaceRenderer } from './BannerSurfaceRenderer';
import ContextualBarSurface from './ContextualBarSurface';
import { FuselageContextualBarSurfaceRenderer } from './FuselageContextualBarRenderer';
import { FuselageModalSurfaceRenderer } from './FuselageModalSurfaceRenderer';
import MessageSurface from './MessageSurface';
import { FuselageMessageSurfaceRenderer } from './MessageSurfaceRenderer';
import ModalSurface from './ModalSurface';
import { createSurfaceRenderer } from './createSurfaceRenderer';

export const bannerParser = new BannerSurfaceRenderer();
export const messageParser = new FuselageMessageSurfaceRenderer();
export const modalParser = new FuselageModalSurfaceRenderer();
export const contextualBarParser = new FuselageContextualBarSurfaceRenderer();

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
