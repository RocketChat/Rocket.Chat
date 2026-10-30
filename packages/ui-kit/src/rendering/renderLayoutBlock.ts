import { BlockContext } from './BlockContext.js';
import type { BlockRenderers } from './BlockRenderers.js';
import type { LayoutBlockRenderer } from './LayoutBlockRenderer.js';
import type { LayoutBlock } from '../blocks/LayoutBlock.js';
import type { ConditionalBlock } from '../blocks/layout/ConditionalBlock.js';

const getLayoutBlockRenderer = <T>(
	renderers: BlockRenderers<T>,
	type: Exclude<LayoutBlock, ConditionalBlock>['type'],
): LayoutBlockRenderer<T> | undefined => renderers[type] as LayoutBlockRenderer<T> | undefined;

export const renderLayoutBlock =
	<T>(renderers: BlockRenderers<T>) =>
	(layoutBlock: Exclude<LayoutBlock, ConditionalBlock>, index: number): T | null => {
		const renderer = getLayoutBlockRenderer(renderers, layoutBlock.type);

		if (!renderer) {
			return null;
		}

		return renderer.call(renderers, layoutBlock, BlockContext.BLOCK, index);
	};
