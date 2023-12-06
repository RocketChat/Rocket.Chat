import type { Conditions } from '../../rendering/Conditions';
import type { LayoutBlockish } from '../LayoutBlockish';
import type { RenderableLayoutBlock } from '../RenderableLayoutBlock';

export type ConditionalBlock = LayoutBlockish<{
	type: 'conditional';
	when?: {
		[K in keyof Conditions]: readonly Conditions[K][];
	};
	render: readonly RenderableLayoutBlock[];
}>;
