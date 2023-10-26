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
import type { ContextType, FormEvent, UIEvent } from 'react';
import React, { memo, useMemo } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { useUiKitActionManager } from '../../../../UIKit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../../../UIKit/hooks/useUiKitView';
import { ContextualbarClose, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { preventSyntheticEvent } from '../../../../lib/utils/preventSyntheticEvent';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type UiKitContextualBarProps = {
	key: UiKit.ContextualBarView['id']; // force re-mount when viewId changes
	initialView: UiKit.ContextualBarView;
};

const UiKitContextualBar = ({ initialView }: UiKitContextualBarProps): JSX.Element => {
	const { closeTab } = useRoomToolbox();
	const actionManager = useUiKitActionManager();

	const { view, values, updateValues, state } = useUiKitView(initialView);

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);

	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ appId, viewId, actionId, dispatchActionConfig, blockId, value }): Promise<void> => {
				if (!appId || !viewId) {
					return;
				}

				const emit = dispatchActionConfig?.includes('on_character_entered') ? debouncedEmitInteraction : emitInteraction;

				await emit(appId, {
					type: 'blockAction',
					actionId,
					container: {
						type: 'view',
						id: viewId,
					},
					payload: {
						blockId,
						value,
					},
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
			viewId: view.id,
		}),
		[debouncedEmitInteraction, emitInteraction, updateValues, values, view],
	);

	const handleSubmit = useMutableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		closeTab();
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewSubmit',
				payload: {
					view: {
						...view,
						state,
					},
				},
				viewId: view.id,
			})
			.finally(() => {
				actionManager.disposeView(view.id);
			});
	});

	const handleCancel = useMutableCallback((e: UIEvent) => {
		preventSyntheticEvent(e);
		closeTab();
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					viewId: view.id,
					view: {
						...view,
						state,
					},
					isCleared: false,
				},
			})
			.finally(() => {
				actionManager.disposeView(view.id);
			});
	});

	const handleClose = useMutableCallback((e: UIEvent) => {
		preventSyntheticEvent(e);
		closeTab();
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					viewId: view.id,
					view: {
						...view,
						state,
					},
					isCleared: true,
				},
			})
			.finally(() => {
				actionManager.disposeView(view.id);
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
