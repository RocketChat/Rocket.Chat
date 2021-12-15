import {
	IUIKitContextualBarInteraction,
	IUIKitErrorInteraction,
	IUIKitSurface,
	IInputElement,
	IInputBlock,
    IActionsBlock,
} from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
import React, { memo, useState, useEffect, useReducer, Dispatch } from 'react';

import { triggerBlockAction, on, off } from '../../../../../app/ui-message/client/ActionManager';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import Apps from './Apps';

type InputFieldState = [string, { value: string | Array<string> | undefined; blockId: string }];
type ActionParams = {
	blockId: string;
	appId: string;
	actionId: string;
	value: unknown;
	viewId?: string;
};

const useValues = (view: IUIKitSurface): [any, Dispatch<any>] => {
	const reducer = useMutableCallback((values, { actionId, payload }) => ({
		...values,
		[actionId]: payload,
	}));

	const initializer = useMutableCallback(() => {
		const filterInputFields = ({
			element,
			elements = [],
		}: IInputBlock | IActionsBlock): boolean => {
			if (element?.initialValue) {
				return true;
			}

			if (
				elements.map((element: IInputElement) => ({ element })).filter(filterInputFields).length
			) {
				return true;
			}

			return false;
		};

		const mapElementToState = ({
			element,
			blockId,
			elements = [],
		}: {
			element: IInputElement;
			blockId: string;
			elements?: IInputElement[];
		}): InputFieldState | InputFieldState[] => {
			if (elements.length) {
				return elements
					.map((element) => ({ element, blockId }))
					.filter(filterInputFields)
					.map(mapElementToState) as InputFieldState[];
			}
			return [element.actionId, { value: element.initialValue, blockId }];
		};

		return view.blocks
			.filter((block: IInputBlock) => filterInputFields(block))
			.map(mapElementToState)
			.reduce((obj, el) => {
				if (Array.isArray(el[0])) {
					return { ...obj, ...Object.fromEntries(el) };
				}

				const [key, value] = el;
				return { ...obj, [key]: value };
			}, {});
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

	const [state, setState] = useState<IUIKitContextualBarInteraction>(payload);
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
