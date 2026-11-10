import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

/** Layout blocks an attachment accepts; every attachment renderer must allow exactly these. */
export const attachmentSurfaceLayoutBlockTypes = [
	'actions',
	'callout',
	'context',
	'divider',
	'image',
	'section',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type AttachmentSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof attachmentSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserAttachment<T> extends SurfaceRenderer<T, AttachmentSurfaceLayoutBlock> {
	public constructor() {
		super(attachmentSurfaceLayoutBlockTypes);
	}
}

export type AttachmentSurfaceLayout = AttachmentSurfaceLayoutBlock[];
