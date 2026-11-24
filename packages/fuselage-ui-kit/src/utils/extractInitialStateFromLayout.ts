import { flattenBlocks } from '@rocket.chat/ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';

import { applyCurrentConversationDefault } from './applyCurrentConversationDefault';
import { type Value, getInitialValue } from './getInitialValue';
import { hasElement } from './hasElement';
import { hasElements } from './hasElements';

const isActionableElement = (element: UiKit.BlockElement | UiKit.TextObject): element is UiKit.ActionableElement =>
	'actionId' in element && typeof element.actionId === 'string';

const reduceInitialValuesFromLayoutBlock =
	(rid: string | undefined) =>
	(
		state: { [actionId: string]: Value },
		{ block, blockId }: { block: UiKit.LayoutBlock; blockId: string | undefined },
	): { [actionId: string]: Value } => {
		if (hasElement(block)) {
			if (isActionableElement(block.element)) {
				state[block.element.actionId] = {
					value: getInitialValue(applyCurrentConversationDefault(block.element, rid)),
					blockId,
				};
			}
		}

		if (hasElements(block)) {
			for (const element of block.elements) {
				if (isActionableElement(element)) {
					state[element.actionId] = {
						value: getInitialValue(applyCurrentConversationDefault(element, rid)),
						blockId,
					};
				}
			}
		}

		return state;
	};

/** The initial value of each element in `blocks`, for a view opened from the room `rid`. */
export const extractInitialStateFromLayout = (blocks: UiKit.LayoutBlock[], rid?: string) =>
	flattenBlocks<UiKit.LayoutBlock>(blocks).reduce(reduceInitialValuesFromLayoutBlock(rid), {});
