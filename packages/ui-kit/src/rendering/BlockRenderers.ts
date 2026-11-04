import type { BlockElementRenderer } from './BlockElementRenderer';
import type { LayoutBlockRenderer } from './LayoutBlockRenderer';
import type { TextObjectRenderer } from './TextObjectRenderer';
import type { BlockElement } from '../blocks/BlockElement';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock';
import type { TextObject } from '../blocks/TextObject';
import type { ElementTypeAlias } from '../blocks/elementTypeAliases';

export type BlockRenderers<T> = {
	[B in RenderableLayoutBlock as B['type']]?: LayoutBlockRenderer<T, B>;
} & {
	[B in TextObject as B['type']]: TextObjectRenderer<T, B>;
} & {
	[B in BlockElement as Exclude<B['type'], ElementTypeAlias>]?: BlockElementRenderer<T, B>;
};
