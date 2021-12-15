import { createContext, useContext } from 'react';

export type UIKitContextValue = {
	viewId: string;
};

export const UIKitContext = createContext<UIKitContextValue>({
	viewId: '',
});

export const useUIKitContext = (): string => {
	const { viewId } = useContext(UIKitContext) || {};

	if (!viewId) {
		throw new Error('no interaction recorded | no view id stored by action manager');
	}

	return viewId;
};
