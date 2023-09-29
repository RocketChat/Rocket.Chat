import type { UiKit } from '@rocket.chat/core-typings';
import { Avatar, Box, Button, ButtonGroup, ContextualbarFooter, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	UiKitComponent,
	UiKitContextualBar as UiKitContextualBarSurfaceRender,
	contextualBarParser,
	UiKitContext,
} from '@rocket.chat/fuselage-ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import type { SyntheticEvent, ContextType } from 'react';
import React, { memo, useMemo } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { useUiKitView } from '../../../../UIKit/hooks/useUiKitView';
import { ContextualbarClose, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import type { InputFieldStateByBlockId, InputFieldStateObject, InputFieldStateTuple } from './hooks/useValues';
import { useValues } from './hooks/useValues';

type UiKitContextualBarProps = {
	key: UiKit.ContextualBarView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.ContextualBarView;
};

const UiKitContextualBar = ({ initialView }: UiKitContextualBarProps): JSX.Element => {
	const { closeTab } = useRoomToolbox();
	const actionManager = useUiKitActionManager();

	const { view } = useUiKitView(initialView);

	const [values, updateValues] = useValues(view.blocks);

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

	const triggerBlockAction = useMemo(() => actionManager.triggerBlockAction.bind(actionManager), [actionManager]);
	const debouncedTriggerBlockAction = useDebouncedCallback(triggerBlockAction, 700);

	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ appId, viewId, actionId, dispatchActionConfig }): Promise<void> => {
				if (!appId || !viewId) {
					return;
				}

				const trigger = dispatchActionConfig?.includes('on_character_entered') ? debouncedTriggerBlockAction : triggerBlockAction;

				await trigger({
					container: {
						type: 'view',
						id: viewId,
					},
					actionId,
					appId,
				});
			},
			state: ({ actionId, value, blockId = 'default' }) => {
				updateValues({
					actionId,
					payload: {
						blockId,
						value,
					},
				});
			},
			...view,
			values,
		}),
		[debouncedTriggerBlockAction, triggerBlockAction, updateValues, values, view],
	);

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		actionManager.triggerSubmitView({
			viewId: view.viewId,
			appId: view.appId,
			payload: {
				view: {
					...view,
					id: view.viewId,
					state: groupStateByBlockId(values),
				},
			},
		});
	});

	const handleCancel = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		return actionManager.triggerCancel({
			appId: view.appId,
			viewId: view.viewId,
			view: {
				...view,
				id: view.viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		return actionManager.triggerCancel({
			appId: view.appId,
			viewId: view.viewId,
			view: {
				...view,
				id: view.viewId,
				state: groupStateByBlockId(values),
			},
			isCleared: true,
		});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<ContextualbarHeader>
				<Avatar url={getURL(`/api/apps/${view.appId}/icon`)} />
				<ContextualbarTitle>{contextualBarParser.text(view.title, BlockContext.NONE, 0)}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Box is='form' method='post' action='#' onSubmit={handleSubmit}>
					<UiKitComponent render={UiKitContextualBarSurfaceRender} blocks={view.blocks} />
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
						<Button {...getButtonStyle(view.submit)} onClick={handleSubmit}>
							{contextualBarParser.text(view.submit.text, BlockContext.NONE, 1)}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</UiKitContext.Provider>
	);
};

export default memo(UiKitContextualBar);
