import type { BlockContext } from './BlockContext.js';
import type { BlockElementRenderer } from './BlockElementRenderer.js';
import type { BlockRenderers } from './BlockRenderers.js';
import type { BlockElement } from '../blocks/BlockElement.js';
import { type CanonicalElementType, toCanonicalElement, toCanonicalElementType } from '../blocks/elementTypeAliases.js';

const getBlockElementRenderer = <T>(renderers: BlockRenderers<T>, type: CanonicalElementType): BlockElementRenderer<T> | undefined =>
	renderers[type] as BlockElementRenderer<T> | undefined;

export const renderBlockElement =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(rawElement: BlockElement, index: number): T | null => {
		const blockElement = toCanonicalElement(rawElement);
		const renderer = getBlockElementRenderer(renderers, toCanonicalElementType(blockElement.type));

		return renderer?.call(renderers, blockElement, context, index) ?? null;
	};
