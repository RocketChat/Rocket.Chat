import type { UIKitUserInteractionResult, UiKit, UiKitPayload } from '@rocket.chat/core-typings';
import { isErrorType } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';

export function useUIKitStateManager(initialState: UiKit.ModalView): any;
export function useUIKitStateManager<S extends UiKitPayload | UiKit.View>(initialState: S): S;
export function useUIKitStateManager<S extends UiKitPayload | UiKit.View>(initialState: S): S {
	const actionManager = useUiKitActionManager();
	const [state, setState] = useSafely(useState(initialState));

	const { viewId } = state;

	useEffect(() => {
		const handleUpdate = ({ ...data }: UIKitUserInteractionResult): void => {
			if (isErrorType(data)) {
				const { errors } = data;
				setState((state) => ({ ...state, errors }));
				return;
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { type, ...rest } = data;
			setState(rest as any);
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, setState, viewId]);

	return state;
}
