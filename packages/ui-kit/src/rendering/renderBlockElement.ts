import type { BlockContext } from './BlockContext';
import type { BlockElementRenderer } from './BlockElementRenderer';
import type { BlockRenderers } from './BlockRenderers';
import type { BlockElement } from '../blocks/BlockElement';
import { type CanonicalElementType, toCanonicalElement, toCanonicalElementType } from '../blocks/elementTypeAliases';

const getBlockElementRenderer = <T>(renderers: BlockRenderers<T>, type: CanonicalElementType): BlockElementRenderer<T> | undefined =>
	renderers[type] as BlockElementRenderer<T> | undefined;

export const renderBlockElement =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(rawElement: BlockElement, index: number): T | null => {
		const blockElement = toCanonicalElement(rawElement);
		const renderer = getBlockElementRenderer(renderers, toCanonicalElementType(blockElement.type));

		return renderer?.call(renderers, blockElement, context, index) ?? null;
	};
