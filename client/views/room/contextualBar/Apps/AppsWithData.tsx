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
import React, { memo, useState, useEffect, useReducer, Dispatch, SyntheticEvent } from 'react';

import {
	triggerBlockAction,
	triggerCancel,
	triggerSubmitView,
	on,
	off,
} from '../../../../../app/ui-message/client/ActionManager';
import { App } from '../../../admin/apps/types';
import Apps from './Apps';

type FieldState = { value: string | Array<string> | undefined; blockId: string };
type InputFieldStateTuple = [string, string | FieldState];
type InputFieldStateObject = { key: string; value: FieldState };
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

		const mapElementToState = (block: IBlock): InputFieldStateTuple | InputFieldStateTuple[] => {
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
				) as InputFieldStateTuple[];
		};

		return view.blocks
			.filter(filterInputFields)
			.map(mapElementToState)
			.reduce((obj, el: InputFieldStateTuple | InputFieldStateTuple[]) => {
				if (Array.isArray(el[0])) {
					return { ...obj, ...Object.fromEntries(el as InputFieldStateTuple[]) };
				}

				const [key, value] = el as InputFieldStateTuple;
				return { ...obj, [key]: value };
			}, {} as { key: string; value: FieldState });
	});

	return useReducer(reducer, null, initializer);
};

const AppsWithData = ({
	viewId,
	payload,
	appInfo,
}: {
	viewId: string;
	payload: IUIKitContextualBarInteraction;
	appInfo: App;
}): JSX.Element => {
	const { id: appId, name: appName } = appInfo;

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

	const groupStateByBlockId = (obj: InputFieldStateObject): InputFieldStateTuple =>
		Object.entries(obj).reduce((obj, [key, { blockId, value }]) => {
			obj[blockId] = obj[blockId] || {};
			obj[blockId][key] = value;
			return obj;
		}, {});

	const prevent = (e: SyntheticEvent): void => {
		if (e) {
			(e.nativeEvent || e).stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		}
	};

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

	const handleSubmit = useMutableCallback((e: SyntheticEvent) => {
		prevent(e);
		triggerSubmitView({
			viewId,
			appId,
			payload: {
				view: {
					...view,
					id: viewId,
					state: groupStateByBlockId(values),
				},
			},
		});
	});

	const handleCancel = useMutableCallback((e: SyntheticEvent) => {
		prevent(e);
		return triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback((e: SyntheticEvent) => {
		prevent(e);
		return triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
			isCleared: true,
		});
	});

	return (
		<kitContext.Provider value={context}>
			<Apps
				onClose={handleClose}
				onCancel={handleCancel}
				onSubmit={handleSubmit}
				view={view}
				appName={appName}
				appId={appId}
			/>
		</kitContext.Provider>
	);
};

export default memo(AppsWithData);
