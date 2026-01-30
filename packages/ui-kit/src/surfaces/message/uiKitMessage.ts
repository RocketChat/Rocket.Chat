import type { MessageSurfaceLayout } from './UiKitParserMessage';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';

export const uiKitMessage = createSurfaceRenderer<MessageSurfaceLayout[number]>();
