import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock.js';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer.js';

/** Layout blocks a message accepts; every message renderer must allow exactly these. */
export const messageSurfaceLayoutBlockTypes = [
	'actions',
	'callout',
	'context',
	'context_actions',
	'divider',
	'file',
	'header',
	'image',
	'info_card',
	'input',
	'markdown',
	'plan',
	'preview',
	'rich_text',
	'section',
	'table',
	'task_card',
	'video',
	'video_conf',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type MessageSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof messageSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserMessage<OutputElement> extends SurfaceRenderer<OutputElement, MessageSurfaceLayoutBlock> {
	public constructor() {
		super(messageSurfaceLayoutBlockTypes);
	}
}

export type MessageSurfaceLayout = MessageSurfaceLayoutBlock[];
