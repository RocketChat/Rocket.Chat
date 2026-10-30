import type { Conditions } from '../../rendering/Conditions.js';
import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { RenderableLayoutBlock } from '../RenderableLayoutBlock.js';

export type ConditionalBlock = LayoutBlockish<{
	type: 'conditional';
	when?: {
		[K in keyof Conditions]: readonly Conditions[K][];
	};
	render: readonly RenderableLayoutBlock[];
}>;
