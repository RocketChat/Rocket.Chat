import type { UiKit } from '@rocket.chat/core-typings';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { ContextType, FormEvent } from 'react';
import React, { useMemo } from 'react';

import { useUiKitActionManager } from '../../../UIKit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../../UIKit/hooks/useUiKitView';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import { preventSyntheticEvent } from '../../../lib/utils/preventSyntheticEvent';
import ModalBlock from './ModalBlock';

type UiKitModalProps = {
	key: UiKit.ModalView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.ModalView;
};

const UiKitModal = ({ initialView }: UiKitModalProps) => {
	const actionManager = useUiKitActionManager();
	const { view, errors, values, updateValues, state } = useUiKitView(initialView);

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);

	// TODO: this structure is atrociously wrong; we should revisit this
	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ actionId, viewId, appId, dispatchActionConfig, blockId, value }) => {
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
			state: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
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
		[debouncedEmitInteraction, emitInteraction, updateValues, values, view],
	);

	const handleSubmit = useMutableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewSubmit',
				payload: {
					view: {
						...view,
						id: view.viewId,
						state,
					},
				},
				viewId: view.viewId,
			})
			.finally(() => {
				actionManager.disposeView(view.viewId);
			});
	});

	const handleCancel = useMutableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					viewId: view.viewId,
					view: {
						...view,
						id: view.viewId,
						state,
					},
					isCleared: false,
				},
			})
			.finally(() => {
				actionManager.disposeView(view.viewId);
			});
	});

	const handleClose = useMutableCallback(() => {
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					viewId: view.viewId,
					view: {
						...view,
						id: view.viewId,
						state,
					},
					isCleared: true,
				},
			})
			.finally(() => {
				actionManager.disposeView(view.viewId);
			});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<MarkupInteractionContext.Provider
				value={{
					detectEmoji,
				}}
			>
				<ModalBlock view={view} errors={errors} appId={view.appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
			</MarkupInteractionContext.Provider>
		</UiKitContext.Provider>
	);
};

export default UiKitModal;
