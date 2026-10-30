import type { AttachmentSurfaceLayout } from './UiKitParserAttachment.js';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer.js';

export const uiKitAttachment = createSurfaceRenderer<AttachmentSurfaceLayout[number]>();
