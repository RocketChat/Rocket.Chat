import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { kitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { ContextType, ReactElement, ReactEventHandler } from 'react';
import React from 'react';

import * as ActionManager from '../../../../app/ui-message/client/ActionManager';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import ModalBlock from './ModalBlock';
import type { ActionManagerState } from './hooks/useActionManagerState';
import { useActionManagerState } from './hooks/useActionManagerState';
import { useValues } from './hooks/useValues';

const UiKitModal = (props: ActionManagerState): ReactElement => {
	const state = useActionManagerState(props);

	const { appId, viewId, mid: _mid, errors, view } = state;

	const [values, updateValues] = useValues(view.blocks as LayoutBlock[]);

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

	const debouncedBlockAction = useDebouncedCallback((actionId, appId, value, blockId, mid) => {
		ActionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: viewId,
			},
			actionId,
			appId,
			value,
			blockId,
			mid,
		});
	}, 700);

	// TODO: this structure is atrociously wrong; we should revisit this
	const context: ContextType<typeof kitContext> = {
		// @ts-expect-error Property 'mid' does not exist on type 'ActionParams'.
		action: ({ actionId, appId, value, blockId, mid = _mid, dispatchActionConfig }) => {
			if (Array.isArray(dispatchActionConfig) && dispatchActionConfig.includes('on_character_entered')) {
				debouncedBlockAction(actionId, appId, value, blockId, mid);
			} else {
				ActionManager.triggerBlockAction({
					container: {
						type: UIKitIncomingInteractionContainerType.VIEW,
						id: viewId,
					},
					actionId,
					appId,
					value,
					blockId,
					mid,
				});
			}
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
		...state,
		values,
	};

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
		ActionManager.triggerSubmitView({
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
		ActionManager.triggerCancel({
			viewId,
			appId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback(() => {
		ActionManager.triggerCancel({
			viewId,
			appId,
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
			<MarkupInteractionContext.Provider
				value={{
					detectEmoji,
				}}
			>
				<ModalBlock view={view} errors={errors} appId={appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
			</MarkupInteractionContext.Provider>
		</kitContext.Provider>
	);
};

export default UiKitModal;
