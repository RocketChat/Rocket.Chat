import { IActionsBlock, IBlock, IInputBlock, IInputElement } from '@rocket.chat/apps-engine/definition/uikit';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Dispatch, useReducer } from 'react';

import { UIKitFormState, UiKitPayload } from '../../../definition/UIKit';


const isInputBlock = (block: IBlock): block is IInputBlock => 'element' in block;

const isActionsOrContextBlock = (block: IBlock): block is IActionsBlock => 'elements' in block;

const filterInputFields = (value: any): value is IInputBlock | IActionsBlock => {
	if (isInputBlock(value) && value.element.initialValue) {
		return true;
	}

	if (isActionsOrContextBlock(value) && value.elements.length && value.elements.map((element) => ({ element }) as unknown as IBlock).filter(filterInputFields).length) {
		return true;
	}

	return false;
};

type UIKitFormStateChangeDispatch = {
	actionId: string;
	payload: {
		value: IInputElement['initialValue'];
		blockId: string;
		appId: string;
	};
}
const mapElementToState = (block: IInputBlock | IActionsBlock): UIKitFormState[] => {
	const { blockId = 'default', appId = 'core', type } = block;

	if (isActionsOrContextBlock(block) && block.elements.length) {
		const el = block.elements.map((element) => ({ element, blockId, appId, type }) as IBlock);
		const filtered = el.filter(filterInputFields);
		const mapped = filtered.flatMap(mapElementToState);
		return mapped;
	}

	return [{ [(block as IInputBlock).element.actionId]: { value: (block as IInputBlock).element.initialValue, blockId, appId } }];
};

const reducer = (values: UIKitFormState, { actionId, payload }: UIKitFormStateChangeDispatch): UIKitFormState => ({
	...values,
	[actionId]: payload,
});


const useUIKitFormValues = (view: UiKitPayload): [UIKitFormState, Dispatch<UIKitFormStateChangeDispatch>] => {
	const initializer = useMutableCallback(() => {
		const filteredBlock = view.blocks.filter(filterInputFields) as unknown as (IInputBlock | IActionsBlock)[];
		const mappedBlocks = filteredBlock.flatMap(mapElementToState);
		return mappedBlocks.reduce((obj, el) => ({ ...obj, ...el }), {} as UIKitFormState);
	});

	return useReducer(reducer, {}, initializer);
};

export { useUIKitFormValues };
