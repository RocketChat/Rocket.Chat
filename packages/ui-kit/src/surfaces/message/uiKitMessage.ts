import type { MessageSurfaceLayout } from './UiKitParserMessage.js';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer.js';

export const uiKitMessage = createSurfaceRenderer<MessageSurfaceLayout[number]>();
