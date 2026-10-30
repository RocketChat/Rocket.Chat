import type { ContextualBarSurfaceLayout } from './UiKitParserContextualBar.js';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer.js';

export const uiKitContextualBar = createSurfaceRenderer<ContextualBarSurfaceLayout[number]>();
