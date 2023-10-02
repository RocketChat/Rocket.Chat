import BannerSurface from './BannerSurface';
import ContextualBarSurface from './ContextualBarSurface';
import { FuselageContextualBarSurfaceRenderer } from './FuselageContextualBarRenderer';
import { FuselageModalSurfaceRenderer } from './FuselageModalSurfaceRenderer';
import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';
import MessageSurface from './MessageSurface';
import { FuselageMessageSurfaceRenderer } from './MessageSurfaceRenderer';
import ModalSurface from './ModalSurface';
import { createSurfaceRenderer } from './createSurfaceRenderer';

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
