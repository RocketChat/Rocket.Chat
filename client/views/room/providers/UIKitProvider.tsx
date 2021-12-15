import React, { ReactNode, useContext } from 'react';

import { useCurrentRoute } from '../../../contexts/RouterContext';
import { UIKitContext } from '../lib/UIKit/UIKitContext';

const UIKitProvider = ({ children }: { children: ReactNode }): JSX.Element => {
	const [, params] = useCurrentRoute();

	const viewId = params?.context;

	const contextValue = {
		viewId: viewId || '',
	};

	return <UIKitContext.Provider value={contextValue}>{children}</UIKitContext.Provider>;
};

export const useAppsContextualBar = (): string | undefined => useContext(UIKitContext).viewId;

export default UIKitProvider;
