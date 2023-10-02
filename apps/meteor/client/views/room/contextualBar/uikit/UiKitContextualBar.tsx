import type {
	IUIKitContextualBarInteraction,
	IUIKitErrorInteraction,
	IUIKitSurface,
	IInputElement,
	IInputBlock,
	IBlock,
	IBlockElement,
	IActionsBlock,
} from '@rocket.chat/apps-engine/definition/uikit';
import { InputElementDispatchAction } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { Avatar, Box, Button, ButtonGroup, ContextualbarFooter, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	UiKitComponent,
	UiKitContextualBar as UiKitContextualBarSurfaceRender,
	contextualBarParser,
	UiKitContext,
} from '@rocket.chat/fuselage-ui-kit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { BlockContext, type Block } from '@rocket.chat/ui-kit';
import type { Dispatch, SyntheticEvent, ContextType } from 'react';
import React, { memo, useState, useEffect, useReducer } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { ContextualbarClose, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type FieldStateValue = string | Array<string> | undefined;
type FieldState = { value: FieldStateValue; blockId: string };
type InputFieldStateTuple = [string, FieldState];
type InputFieldStateObject = { [key: string]: FieldState };
type InputFieldStateByBlockId = { [blockId: string]: { [actionId: string]: FieldStateValue } };
type ActionParams = {
	blockId: string;
	appId: string;
	actionId: string;
	value: unknown;
	viewId?: string;
	dispatchActionConfig?: InputElementDispatchAction[];
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

		return view.blocks
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

const UiKitContextualBar = ({
	viewId,
	roomId,
	payload,
	appId,
}: {
	viewId: string;
	roomId: string;
	payload: IUIKitContextualBarInteraction;
	appId: string;
}): JSX.Element => {
	const actionManager = useUiKitActionManager();
	const { closeTab } = useRoomToolbox();

	const [state, setState] = useState<ViewState>(payload);
	const { view } = state;
	const [values, updateValues] = useValues(view);

	useEffect(() => {
		const handleUpdate = ({ type, ...data }: IUIKitContextualBarInteraction | IUIKitErrorInteraction): void => {
			if (type === 'errors') {
				const { errors } = data as Omit<IUIKitErrorInteraction, 'type'>;
				setState((state: ViewState) => ({ ...state, errors }));
				return;
			}

			setState(data as IUIKitContextualBarInteraction);
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, state, viewId]);

	const groupStateByBlockId = (obj: InputFieldStateObject): InputFieldStateByBlockId =>
		Object.entries(obj).reduce((obj: InputFieldStateByBlockId, [key, { blockId, value }]: InputFieldStateTuple) => {
			obj[blockId] = obj[blockId] || {};
			obj[blockId][key] = value;
			return obj;
		}, {} as InputFieldStateByBlockId);

	const prevent = (e: SyntheticEvent): void => {
		if (e) {
			(e.nativeEvent || e).stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		}
	};

	const debouncedBlockAction = useDebouncedCallback(({ actionId, appId, value, blockId }: ActionParams) => {
		actionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: viewId,
			},
			actionId,
			appId,
			value,
			blockId,
		});
	}, 700);

	const context: ContextType<typeof UiKitContext> = {
		action: async ({ actionId, appId, value, blockId, dispatchActionConfig }: ActionParams): Promise<void> => {
			if (Array.isArray(dispatchActionConfig) && dispatchActionConfig.includes(InputElementDispatchAction.ON_CHARACTER_ENTERED)) {
				await debouncedBlockAction({ actionId, appId, value, blockId });
			} else {
				await actionManager.triggerBlockAction({
					container: {
						type: UIKitIncomingInteractionContainerType.VIEW,
						id: viewId,
					},
					actionId,
					appId,
					rid: roomId,
					value,
					blockId,
				});
			}
		},
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
	} as ContextType<typeof UiKitContext>;

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		actionManager.triggerSubmitView({
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

	const handleCancel = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		return actionManager.triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		return actionManager.triggerCancel({
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
		<UiKitContext.Provider value={context}>
			<ContextualbarHeader>
				<Avatar url={getURL(`/api/apps/${appId}/icon`)} />
				<ContextualbarTitle>{contextualBarParser.text(view.title, BlockContext.NONE, 0)}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Box is='form' method='post' action='#' onSubmit={handleSubmit}>
					<UiKitComponent render={UiKitContextualBarSurfaceRender} blocks={view.blocks as LayoutBlock[]} />
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{view.close && (
						<Button danger={view.close.style === 'danger'} onClick={handleCancel}>
							{contextualBarParser.text(view.close.text, BlockContext.NONE, 0)}
						</Button>
					)}
					{view.submit && (
						<Button {...getButtonStyle(view)} onClick={handleSubmit}>
							{contextualBarParser.text(view.submit.text, BlockContext.NONE, 1)}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</UiKitContext.Provider>
	);
};

export default memo(UiKitContextualBar);
