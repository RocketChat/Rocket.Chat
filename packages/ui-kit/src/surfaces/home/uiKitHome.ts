import type { HomeSurfaceLayout } from './UiKitParserHome';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';

export const uiKitHome = createSurfaceRenderer<HomeSurfaceLayout[number]>();
