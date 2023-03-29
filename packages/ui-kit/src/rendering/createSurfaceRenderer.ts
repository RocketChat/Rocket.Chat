import type { Block } from '../blocks/Block';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock';
import type { Conditions } from './Conditions';
import type { SurfaceRenderer } from './SurfaceRenderer';

export const createSurfaceRenderer =
	<T, B extends RenderableLayoutBlock>() =>
	(surfaceRenderer: SurfaceRenderer<T, B>, conditions?: Conditions) =>
	(blocks: readonly { type: string }[]): T[] =>
		surfaceRenderer.render(blocks as Block[], conditions);
