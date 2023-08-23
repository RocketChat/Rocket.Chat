import type { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';
import { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';

export type ActionManagerState = {
	viewId: string;
	type: 'errors' | string;
	appId: string;
	mid: string;
	errors: Record<string, string>;
	view: IUIKitSurface;
};

export const useActionManagerState = (initialState: ActionManagerState) => {
	const actionManager = useUiKitActionManager();
	const [state, setState] = useState(initialState);

	const { viewId } = state;

	useEffect(() => {
		const handleUpdate = ({ type, errors, ...data }: ActionManagerState) => {
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

	return state;
};
