import type { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { Block } from '@rocket.chat/ui-kit';
import type { ReactEventHandler } from 'react';
import React, { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../../../hooks/useUiKitActionManager';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import { useModalContextValue } from '../../../uikit/hooks/useModalContextValue';
import ModalBlock from './ModalBlock';
import { useValues } from './hooks/useValues';

type UiKitModalProps = {
	initialState: ModalState;
};

export type ModalState = {
	appId: string;
	errors: Record<string, string>;
	mid: string;
	type: 'errors' | string;
	view: IUIKitSurface;
	viewId: string;
};

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

const UiKitModal = ({ initialState }: UiKitModalProps) => {
	const actionManager = useUiKitActionManager();
	const [state, setState] = useState(initialState);

	const { appId, viewId, errors, view } = state;

	const [values, updateValues] = useValues(view.blocks as Block[]);
	const contextValue = useModalContextValue({ values, updateValues, ...state });

	useEffect(() => {
		const handleUpdate = ({ type, errors, ...data }: ModalState) => {
			if (type === 'errors') {
				setState((state) => ({ ...state, errors, type }));
				return;
			}

			setState({ ...data, type, errors });
		};

		actionManager.on(viewId, handleUpdate);

		return () => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, viewId]);

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
