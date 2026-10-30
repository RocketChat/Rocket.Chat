import type { BannerSurfaceLayout } from './UiKitParserBanner.js';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer.js';

export const uiKitBanner = createSurfaceRenderer<BannerSurfaceLayout[number]>();
