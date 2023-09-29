import type { UIKitUserInteractionResult, UiKit, UiKitPayload } from '@rocket.chat/core-typings';
import { isErrorType } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';

type ViewState<TView extends UiKitPayload | UiKit.View> = {
	view: TView;
	errors?: { [field: string]: string }[];
};

export function useUiKitView(initialView: UiKit.ModalView): ViewState<UiKit.ModalView>;
export function useUiKitView(initialView: UiKit.ContextualBarView): ViewState<UiKit.ContextualBarView>;
export function useUiKitView<S extends UiKitPayload | UiKit.View>(initialView: S): ViewState<S>;
export function useUiKitView<S extends UiKitPayload | UiKit.View>(initialView: S): ViewState<S> {
	const [state, setState] = useSafely(useState<ViewState<S>>({ view: initialView }));
	const actionManager = useUiKitActionManager();

	const { viewId } = state.view;

	useEffect(() => {
		const handleUpdate = (data: UIKitUserInteractionResult): void => {
			if (isErrorType(data)) {
				const { errors } = data;
				setState((state) => ({ ...state, errors }));
				return;
			}

			setState((state) => {
				const { type, ...rest } = data;
				return {
					...state,
					view: { ...state.view, ...rest },
				};
			});
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, setState, viewId]);

	return state;
}
