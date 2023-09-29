import type { UiKit } from '@rocket.chat/core-typings';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { ContextType, ReactEventHandler } from 'react';
import React, { useMemo } from 'react';

import { useUiKitView } from '../../../UIKit/hooks/useUiKitView';
import { useUiKitActionManager } from '../../../hooks/useUiKitActionManager';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import ModalBlock from './ModalBlock';
import { useValues } from './hooks/useValues';

type UiKitModalProps = {
	key: UiKit.ModalView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.ModalView;
};

const UiKitModal = ({ initialView }: UiKitModalProps) => {
	const actionManager = useUiKitActionManager();
	const { view, errors } = useUiKitView(initialView);
	const [values, updateValues] = useValues(view.blocks);

	const groupStateByBlockId = (values: { value: unknown; blockId: string }[]) =>
		Object.entries(values).reduce<any>((obj, [key, { blockId, value }]) => {
			obj[blockId] = obj[blockId] || {};
			obj[blockId][key] = value;

			return obj;
		}, {});

	const prevent: ReactEventHandler = (e) => {
		if (e) {
			(e.nativeEvent || e).stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		}
	};

	const triggerBlockAction = useMemo(() => actionManager.triggerBlockAction.bind(actionManager), [actionManager]);
	const debouncedTriggerBlockAction = useDebouncedCallback(triggerBlockAction, 700);

	// TODO: this structure is atrociously wrong; we should revisit this
	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ actionId, viewId, appId, dispatchActionConfig }) => {
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
		[debouncedTriggerBlockAction, triggerBlockAction, updateValues, values, view],
	);

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
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
		actionManager.triggerCancel({
			viewId: view.viewId,
			appId: view.appId,
			view: {
				...view,
				id: view.viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback(() => {
		actionManager.triggerCancel({
			viewId: view.viewId,
			appId: view.appId,
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
