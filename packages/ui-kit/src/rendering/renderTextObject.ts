import type { BlockContext } from './BlockContext';
import type { BlockRenderers } from './BlockRenderers';
import type { TextObjectRenderer } from './TextObjectRenderer';
import type { TextObject } from '../blocks/TextObject';

const getTextObjectRenderer = <T>(renderers: BlockRenderers<T>, type: TextObject['type']): TextObjectRenderer<T> | undefined =>
	renderers[type] as TextObjectRenderer<T> | undefined;

export const renderTextObject =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(textObject: TextObject, index: number): T | null => {
		const renderer = getTextObjectRenderer(renderers, textObject.type);

		return renderer?.call(renderers, textObject, context, index) ?? null;
	};
