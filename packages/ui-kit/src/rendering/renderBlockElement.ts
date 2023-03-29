import type { BlockElement } from '../blocks/BlockElement';
import type { BlockContext } from './BlockContext';
import type { BlockElementRenderer } from './BlockElementRenderer';
import type { BlockRenderers } from './BlockRenderers';

const getBlockElementRenderer = <T>(renderers: BlockRenderers<T>, type: BlockElement['type']): BlockElementRenderer<T> | undefined => {
	const renderer = renderers[type] as BlockElementRenderer<T> | undefined;

	if (renderer) {
		return renderer;
	}

	switch (type) {
		case 'datepicker':
			return renderers.datePicker as BlockElementRenderer<T> | undefined;

		case 'static_select':
			return renderers.staticSelect as BlockElementRenderer<T> | undefined;

		case 'multi_static_select':
			return renderers.multiStaticSelect as BlockElementRenderer<T> | undefined;

		case 'plain_text_input':
			return renderers.plainInput as BlockElementRenderer<T> | undefined;

		case 'linear_scale':
			return renderers.linearScale as BlockElementRenderer<T> | undefined;
	}
};

export const renderBlockElement =
	<T>(renderers: BlockRenderers<T>, context: BlockContext) =>
	(blockElement: BlockElement, index: number): T | null => {
		const renderer = getBlockElementRenderer(renderers, blockElement.type);

		if (!renderer) {
			return null;
		}

		return renderer.call(renderers, blockElement, context, index);
	};
