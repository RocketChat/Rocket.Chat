import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';
import type { BannerSurfaceLayout } from './UiKitParserBanner';

export const uiKitBanner = createSurfaceRenderer<BannerSurfaceLayout[number]>();
