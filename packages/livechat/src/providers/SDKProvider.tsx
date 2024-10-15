import type { DDPSDK } from '@rocket.chat/ddp-client';
import { createContext, type ComponentChildren } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

import { Livechat } from '../api';

type SDKContextValue = {
	sdk?: DDPSDK;
};

const SDKContext = createContext<SDKContextValue>({});

export const useSDK = () => {
	const context = useContext(SDKContext);
	if (!context.sdk) {
		throw new Error('useSDK must be used within a SDKProvider');
	}
	return context.sdk;
};

const SDKProvider = ({ children }: { serverURL: string; children: ComponentChildren }) => {
	const sdk = useMemo(() => Livechat, []);

	return <SDKContext.Provider value={{ sdk }}>{children}</SDKContext.Provider>;
};

export default SDKProvider;
