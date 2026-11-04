import type { BlockContext } from './BlockContext';
import type { BlockElementRenderer } from './BlockElementRenderer';
import type { BlockRenderers } from './BlockRenderers';
import type { BlockElement } from '../blocks/BlockElement';
import { type AliasedBlockElement, toCanonicalElement } from '../blocks/elementTypeAliases';

const getBlockElementRenderer = <T>(renderers: BlockRenderers<T>, type: BlockElement['type']): BlockElementRenderer<T> | undefined =>
	renderers[type] as BlockElementRenderer<T> | undefined;

export const renderBlockElement =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(rawElement: BlockElement | AliasedBlockElement, index: number): T | null => {
		const blockElement = toCanonicalElement(rawElement);
		const renderer = getBlockElementRenderer(renderers, blockElement.type);

		return renderer?.call(renderers, blockElement, context, index) ?? null;
	};
