import type { BlockContext } from './BlockContext.js';
import type { BlockElementRenderer } from './BlockElementRenderer.js';
import type { BlockRenderers } from './BlockRenderers.js';
import type { BlockElement } from '../blocks/BlockElement.js';

const getBlockElementRenderer = <T>(renderers: BlockRenderers<T>, type: BlockElement['type']): BlockElementRenderer<T> | undefined =>
	renderers[type] as BlockElementRenderer<T> | undefined;

export const renderBlockElement =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(blockElement: BlockElement, index: number): T | null => {
		const renderer = getBlockElementRenderer(renderers, blockElement.type);

		return renderer?.call(renderers, blockElement, context, index) ?? null;
	};
