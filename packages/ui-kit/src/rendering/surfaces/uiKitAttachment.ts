import { createSurfaceRenderer } from '../createSurfaceRenderer';
import type { AttachmentSurfaceLayout } from './UiKitParserAttachment';

export const uiKitAttachment = createSurfaceRenderer<unknown, AttachmentSurfaceLayout[number]>();
