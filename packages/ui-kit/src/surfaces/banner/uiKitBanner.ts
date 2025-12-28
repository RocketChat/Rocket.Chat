import type { BannerSurfaceLayout } from './UiKitParserBanner';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';

export const uiKitBanner = createSurfaceRenderer<BannerSurfaceLayout[number]>();
