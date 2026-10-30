import type { BlockContext } from './BlockContext.js';
import type { BlockRenderers } from './BlockRenderers.js';
import type { TextObjectRenderer } from './TextObjectRenderer.js';
import type { TextObject } from '../blocks/TextObject.js';

const getTextObjectRenderer = <T>(renderers: BlockRenderers<T>, type: TextObject['type']): TextObjectRenderer<T> | undefined =>
	renderers[type] as TextObjectRenderer<T> | undefined;

export const renderTextObject =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(textObject: TextObject, index: number): T | null => {
		const renderer = getTextObjectRenderer(renderers, textObject.type);

		return renderer?.call(renderers, textObject, context, index) ?? null;
	};
