import type { Conditions } from './Conditions.js';
import type { SurfaceRenderer } from './SurfaceRenderer.js';
import type { Block } from '../blocks/Block.js';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock.js';

export const createSurfaceRenderer =
	<TAllowedLayoutBlock extends RenderableLayoutBlock>() =>
	<TOutputObject>(surfaceRenderer: SurfaceRenderer<TOutputObject, TAllowedLayoutBlock>, conditions?: Conditions) =>
	(blocks: readonly { type: string }[]): TOutputObject[] =>
		surfaceRenderer.render(blocks as Block[], conditions);
