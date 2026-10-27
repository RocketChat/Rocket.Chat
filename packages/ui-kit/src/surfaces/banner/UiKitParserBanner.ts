import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

/** Layout blocks a banner accepts; every banner renderer must allow exactly these. */
export const bannerSurfaceLayoutBlockTypes = [
	'actions',
	'callout',
	'context',
	'divider',
	'image',
	'info_card',
	'input',
	'preview',
	'section',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type BannerSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof bannerSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserBanner<T> extends SurfaceRenderer<T, BannerSurfaceLayoutBlock> {
	public constructor() {
		super(bannerSurfaceLayoutBlockTypes);
	}
}

export type BannerSurfaceLayout = BannerSurfaceLayoutBlock[];
