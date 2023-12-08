import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';
import type { ContextualBarSurfaceLayout } from './UiKitParserContextualBar';

export const uiKitContextualBar = createSurfaceRenderer<ContextualBarSurfaceLayout[number]>();
