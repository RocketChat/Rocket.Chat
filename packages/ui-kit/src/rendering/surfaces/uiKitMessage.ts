import { createSurfaceRenderer } from '../createSurfaceRenderer';
import type { MessageSurfaceLayout } from './UiKitParserMessage';

export const uiKitMessage = createSurfaceRenderer<unknown, MessageSurfaceLayout[number]>();
