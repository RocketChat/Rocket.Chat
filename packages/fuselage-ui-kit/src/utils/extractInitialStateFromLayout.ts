import { flattenBlocks } from '@rocket.chat/ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';

import { type Value, getInitialValue } from './getInitialValue';
import { hasElement } from './hasElement';
import { hasElements } from './hasElements';

const isActionableElement = (element: UiKit.BlockElement | UiKit.TextObject): element is UiKit.ActionableElement =>
	'actionId' in element && typeof element.actionId === 'string';

const reduceInitialValuesFromLayoutBlock = (
	state: { [actionId: string]: Value },
	{ block, blockId }: { block: UiKit.LayoutBlock; blockId: string | undefined },
): { [actionId: string]: Value } => {
	if (hasElement(block)) {
		if (isActionableElement(block.element)) {
			state[block.element.actionId] = {
				value: getInitialValue(block.element),
				blockId,
			};
		}
	}

	if (hasElements(block)) {
		for (const element of block.elements) {
			if (isActionableElement(element)) {
				state[element.actionId] = {
					value: getInitialValue(element),
					blockId,
				};
			}
		}
	}

	return state;
};

export const extractInitialStateFromLayout = (blocks: UiKit.LayoutBlock[]) =>
	flattenBlocks<UiKit.LayoutBlock>(blocks).reduce(reduceInitialValuesFromLayoutBlock, {});
