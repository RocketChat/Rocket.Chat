import type { TextObject } from '../blocks/TextObject';
import type { BlockContext } from './BlockContext';
import type { BlockRenderers } from './BlockRenderers';
import type { TextObjectRenderer } from './TextObjectRenderer';

const getTextObjectRenderer = <T>(renderers: BlockRenderers<T>, type: TextObject['type']): TextObjectRenderer<T> | undefined => {
	const renderer = renderers[type] as TextObjectRenderer<T> | undefined;

	if (renderer) {
		return renderer;
	}

	switch (type) {
		case 'plain_text':
			return (renderers.plainText ?? renderers.text) as TextObjectRenderer<T> | undefined;

		case 'mrkdwn':
			return renderers.text as TextObjectRenderer<T> | undefined;
	}
};

export const renderTextObject =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(textObject: TextObject, index: number): T | null => {
		const renderer = getTextObjectRenderer(renderers, textObject.type);

		if (!renderer) {
			return null;
		}

		return renderer.call(renderers, textObject, context, index);
	};
