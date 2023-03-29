import type { LayoutBlockType } from '../LayoutBlockType';
import type { TextObject } from '../TextObject';
import type { ContextBlock } from './ContextBlock';

type Image = {
	url: string;
	dimensions?: {
		width: number;
		height: number;
	};
};

export type PreviewBlockBase = {
	type: `${LayoutBlockType.PREVIEW}`;
	title: TextObject[];
	description: TextObject[];
	footer?: ContextBlock;
};

export type PreviewBlockWithThumb = PreviewBlockBase & {
	thumb: Image;
};

export type PreviewBlockWithPreview = PreviewBlockBase & {
	preview: Image;
	externalUrl?: string;
	oembedUrl?: string;
	thumb: undefined;
};

export type PreviewBlock = PreviewBlockBase | PreviewBlockWithThumb | PreviewBlockWithPreview;

export const isPreviewBlockWithThumb = (previewBlock: PreviewBlock): previewBlock is PreviewBlockWithThumb => 'thumb' in previewBlock;

export const isPreviewBlockWithPreview = (previewBlock: PreviewBlock): previewBlock is PreviewBlockWithPreview =>
	'externalUrl' in previewBlock || 'oembedUrl' in previewBlock;
