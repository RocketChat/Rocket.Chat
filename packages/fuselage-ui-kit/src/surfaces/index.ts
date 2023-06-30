import BannerSurface from './BannerSurface';
import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { createSurfaceRenderer } from './createSurfaceRenderer';
import { FuselageMessageSurfaceRenderer } from './MessageSurfaceRenderer';
import { FuselageModalSurfaceRenderer } from './FuselageModalSurfaceRenderer';
import { FuselageContextualBarSurfaceRenderer } from './FuselageContextualBarRenderer';
import ContextualBarSurface from './ContextualBarSurface';

// export const attachmentParser = new FuselageSurfaceRenderer();
export const bannerParser = new FuselageSurfaceRenderer();
export const messageParser = new FuselageMessageSurfaceRenderer();
export const modalParser = new FuselageModalSurfaceRenderer();
export const contextualBarParser = new FuselageContextualBarSurfaceRenderer();

// export const UiKitAttachment = createSurfaceRenderer(AttachmentSurface, attachmentParser);
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
