import type { HomeSurfaceLayout } from './UiKitParserHome.js';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer.js';

export const uiKitHome = createSurfaceRenderer<HomeSurfaceLayout[number]>();
