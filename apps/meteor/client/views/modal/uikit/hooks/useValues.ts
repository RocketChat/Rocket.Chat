import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { Block, LayoutBlock } from '@rocket.chat/ui-kit';
import { useReducer } from 'react';

type LayoutBlockWithElement = Extract<LayoutBlock, { element: unknown }>;
type LayoutBlockWithElements = Extract<LayoutBlock, { elements: readonly unknown[] }>;
type ElementFromLayoutBlock = LayoutBlockWithElement['element'] | LayoutBlockWithElements['elements'][number];

const hasElementInBlock = (block: LayoutBlock): block is LayoutBlockWithElement => 'element' in block;
const hasElementsInBlock = (block: LayoutBlock): block is LayoutBlockWithElements => 'elements' in block;
const hasInitialValueAndActionId = (
	element: ElementFromLayoutBlock,
): element is Extract<ElementFromLayoutBlock, { actionId: string }> & { initialValue: unknown } =>
	'initialValue' in element && 'actionId' in element && typeof element.actionId === 'string' && !!element?.initialValue;

const extractValue = (element: ElementFromLayoutBlock, obj: Record<string, { value: unknown; blockId?: string }>, blockId?: string) => {
	if (hasInitialValueAndActionId(element)) {
		obj[element.actionId] = { value: element.initialValue, blockId };
	}
};

const reduceBlocks = (obj: Record<string, { value: unknown; blockId?: string }>, block: LayoutBlock) => {
	if (hasElementInBlock(block)) {
		extractValue(block.element, obj, block.blockId);
	}
	if (hasElementsInBlock(block)) {
		for (const element of block.elements) {
			extractValue(element, obj, block.blockId);
		}
	}

	return obj;
};

export const useValues = (blocks: Block[]) => {
	const reducer = useMutableCallback((values, { actionId, payload }) => ({
		...values,
		[actionId]: payload,
	}));

	const initializer = useMutableCallback((blocks: LayoutBlock[]) => {
		const obj: Record<string, { value: unknown; blockId?: string }> = {};

		return blocks.reduce(reduceBlocks, obj);
	});

	return useReducer(reducer, blocks, initializer);
};
