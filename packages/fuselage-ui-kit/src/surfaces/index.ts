import BannerSurface from './BannerSurface';
import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { createSurfaceRenderer } from './createSurfaceRenderer';
import { FuselageMessageSurfaceRenderer } from './MessageSurfaceRenderer';

// export const attachmentParser = new FuselageSurfaceRenderer();
export const bannerParser = new FuselageSurfaceRenderer();
export const messageParser = new FuselageMessageSurfaceRenderer();
export const modalParser = new FuselageSurfaceRenderer();

// export const UiKitAttachment = createSurfaceRenderer(AttachmentSurface, attachmentParser);
export const UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
export const UiKitMessage = createSurfaceRenderer(
  MessageSurface,
  messageParser
);
export const UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
