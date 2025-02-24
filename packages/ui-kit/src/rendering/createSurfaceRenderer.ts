import type { Conditions } from './Conditions';
import type { SurfaceRenderer } from './SurfaceRenderer';
import type { Block } from '../blocks/Block';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock';

export const createSurfaceRenderer =
	<TAllowedLayoutBlock extends RenderableLayoutBlock>() =>
	<TOutputObject>(surfaceRenderer: SurfaceRenderer<TOutputObject, TAllowedLayoutBlock>, conditions?: Conditions) =>
	(blocks: readonly { type: string }[]): TOutputObject[] =>
		surfaceRenderer.render(blocks as Block[], conditions);
