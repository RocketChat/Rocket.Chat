import {
	IUIKitContextualBarInteraction,
	IUIKitErrorInteraction,
	IUIKitSurface,
	IInputElement,
	IInputBlock,
	IBlock,
	IBlockElement,
	IActionsBlock,
} from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
import React, { memo, useState, useEffect, useReducer, Dispatch } from 'react';

import { triggerBlockAction, on, off } from '../../../../../app/ui-message/client/ActionManager';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import Apps from './Apps';

type FieldState = { value: string | Array<string> | undefined; blockId: string };
type InputFieldState = [string, FieldState];
type ActionParams = {
	blockId: string;
	appId: string;
	actionId: string;
	value: unknown;
	viewId?: string;
};

type ViewState = IUIKitContextualBarInteraction & {
	errors?: { [field: string]: string };
};

const isInputBlock = (block: any): block is IInputBlock => block?.element?.initialValue;

const useValues = (view: IUIKitSurface): [any, Dispatch<any>] => {
	const reducer = useMutableCallback((values, { actionId, payload }) => ({
		...values,
		[actionId]: payload,
	}));

	const initializer = useMutableCallback(() => {
		const filterInputFields = (block: IBlock): boolean => {
			if (isInputBlock(block)) {
				return true;
			}

			if (
				((block as IActionsBlock).elements as IInputElement[])?.filter((element) =>
					filterInputFields({ element } as IInputBlock),
				).length
			) {
				return true;
			}

			return false;
		};

		const mapElementToState = (block: IBlock): InputFieldState | InputFieldState[] => {
			if (isInputBlock(block)) {
				const { element, blockId } = block;
				return [element.actionId, { value: element.initialValue, blockId } as FieldState];
			}

			const { elements, blockId }: { elements: IBlockElement[]; blockId?: string } =
				block as IActionsBlock;

			return elements
				.filter((element) => filterInputFields({ element } as IInputBlock))
				.map((element) =>
					mapElementToState({ element, blockId } as IInputBlock),
				) as InputFieldState[];
		};

		return view.blocks
			.filter(filterInputFields)
			.map(mapElementToState)
			.reduce((obj, el: InputFieldState | InputFieldState[]) => {
				if (Array.isArray(el[0])) {
					return { ...obj, ...Object.fromEntries(el as InputFieldState[]) };
				}

				const [key, value] = el as InputFieldState;
				return { ...obj, [key]: value };
			}, {} as { key: string; value: FieldState });
	});

	return useReducer(reducer, null, initializer);
};

const AppsWithData = ({
	viewId,
	payload,
}: {
	viewId: string;
	payload: IUIKitContextualBarInteraction;
}): JSX.Element => {
	const onClose = useTabBarClose();
	const onSubmit = (): boolean => true;

	const [state, setState] = useState<ViewState>(payload);
	const { view } = state;
	const [values, updateValues] = useValues(view);

	useEffect(() => {
		const handleUpdate = ({
			type,
			...data
		}: IUIKitContextualBarInteraction | IUIKitErrorInteraction): void => {
			if (type === 'errors') {
				const { errors } = data as Omit<IUIKitErrorInteraction, 'type'>;
				setState((state) => ({ ...state, errors }));
				return;
			}

			setState(data as IUIKitContextualBarInteraction);
		};

		on(viewId, handleUpdate);

		return (): void => {
			off(viewId, handleUpdate);
		};
	}, [state, viewId]);

	const context = {
		action: ({ actionId, appId, value, blockId }: ActionParams): Promise<void> =>
			triggerBlockAction({
				container: {
					type: UIKitIncomingInteractionContainerType.VIEW,
					id: viewId,
				},
				actionId,
				appId,
				value,
				blockId,
			}),
		state: ({ actionId, value, blockId = 'default' }: ActionParams): void => {
			updateValues({
				actionId,
				payload: {
					blockId,
					value,
				},
			});
		},
		...state,
		values,
	};

	return (
		<kitContext.Provider value={context}>
			<Apps onClose={onClose} onSubmit={onSubmit} view={view} />
		</kitContext.Provider>
	);
};

export default memo(AppsWithData);
