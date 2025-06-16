import type { ContextualBarSurfaceLayout } from './UiKitParserContextualBar';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';

export const uiKitContextualBar = createSurfaceRenderer<ContextualBarSurfaceLayout[number]>();
