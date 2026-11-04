import type { BlockElementRenderer } from './BlockElementRenderer.js';
import type { LayoutBlockRenderer } from './LayoutBlockRenderer.js';
import type { TextObjectRenderer } from './TextObjectRenderer.js';
import type { BlockElement } from '../blocks/BlockElement.js';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock.js';
import type { TextObject } from '../blocks/TextObject.js';
import type { ElementTypeAlias } from '../blocks/elementTypeAliases.js';

export type BlockRenderers<T> = {
	[B in RenderableLayoutBlock as B['type']]?: LayoutBlockRenderer<T, B>;
} & {
	[B in TextObject as B['type']]: TextObjectRenderer<T, B>;
} & {
	[B in BlockElement as Exclude<B['type'], ElementTypeAlias>]?: BlockElementRenderer<T, B>;
};
