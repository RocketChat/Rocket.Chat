import { createSurfaceRenderer } from '../createSurfaceRenderer';
import type { BannerSurfaceLayout } from './UiKitParserBanner';

export const uiKitBanner = createSurfaceRenderer<unknown, BannerSurfaceLayout[number]>();
