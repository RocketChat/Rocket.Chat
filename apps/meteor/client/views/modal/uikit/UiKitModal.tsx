import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { Block } from '@rocket.chat/ui-kit';
import type { ReactElement, ReactEventHandler } from 'react';
import React from 'react';

import { useModalContextValue } from '../../../UiKit/hooks/useModalContextValue';
import { useUiKitActionManager } from '../../../hooks/useUiKitActionManager';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import ModalBlock from './ModalBlock';
import type { ActionManagerState } from './hooks/useActionManagerState';
import { useActionManagerState } from './hooks/useActionManagerState';
import { useValues } from './hooks/useValues';

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

const UiKitModal = (props: ActionManagerState): ReactElement => {
	const actionManager = useUiKitActionManager();
	const state = useActionManagerState(props);
	const { appId, viewId, errors, view } = state;
	const [values, updateValues] = useValues(view.blocks as Block[]);
	const contextValue = useModalContextValue(state, { values, updateValues });

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
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
		actionManager.triggerCancel({
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
		actionManager.triggerCancel({
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
		<UiKitContext.Provider value={contextValue}>
			<MarkupInteractionContext.Provider
				value={{
					detectEmoji,
				}}
			>
				<ModalBlock view={view} errors={errors} appId={appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
			</MarkupInteractionContext.Provider>
		</UiKitContext.Provider>
	);
};

export default UiKitModal;
