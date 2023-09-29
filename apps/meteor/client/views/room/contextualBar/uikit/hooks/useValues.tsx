import type { IInputElement, IInputBlock, IBlock, IBlockElement, IActionsBlock } from '@rocket.chat/apps-engine/definition/uikit';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { type Block } from '@rocket.chat/ui-kit';
import type { Dispatch } from 'react';
import { useReducer } from 'react';

type FieldStateValue = string | Array<string> | undefined;
export type FieldState = { value: FieldStateValue; blockId: string };
export type InputFieldStateTuple = [string, FieldState];
export type InputFieldStateObject = { [key: string]: FieldState };
export type InputFieldStateByBlockId = { [blockId: string]: { [actionId: string]: FieldStateValue } };

const isInputBlock = (block: any): block is IInputBlock => block?.element?.initialValue;

export const useValues = (blocks: LayoutBlock[]): [any, Dispatch<any>] => {
	const reducer = useMutableCallback((values, { actionId, payload }) => ({
		...values,
		[actionId]: payload,
	}));

	const initializer = useMutableCallback(() => {
		const filterInputFields = (block: IBlock | Block): boolean => {
			if (isInputBlock(block)) {
				return true;
			}

			if (
				((block as IActionsBlock).elements as IInputElement[])?.filter((element) => filterInputFields({ element } as IInputBlock)).length
			) {
				return true;
			}

			return false;
		};

		const mapElementToState = (block: IBlock | Block): InputFieldStateTuple | InputFieldStateTuple[] => {
			if (isInputBlock(block)) {
				const { element, blockId } = block;
				return [element.actionId, { value: element.initialValue, blockId } as FieldState];
			}

			const { elements, blockId }: { elements: IBlockElement[]; blockId?: string } = block as IActionsBlock;

			return elements
				.filter((element) => filterInputFields({ element } as IInputBlock))
				.map((element) => mapElementToState({ element, blockId } as IInputBlock)) as InputFieldStateTuple[];
		};

		return blocks
			.filter(filterInputFields)
			.map(mapElementToState)
			.reduce((obj: InputFieldStateObject, el: InputFieldStateTuple | InputFieldStateTuple[]) => {
				if (Array.isArray(el[0])) {
					return { ...obj, ...Object.fromEntries(el as InputFieldStateTuple[]) };
				}

				const [key, value] = el as InputFieldStateTuple;
				return { ...obj, [key]: value };
			}, {} as InputFieldStateObject);
	});

	return useReducer(reducer, null, initializer);
};
