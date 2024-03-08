import type { DDPSDK } from '@rocket.chat/ddp-client';
import React, { createContext, useEffect, useMemo } from 'react';

import { Livechat } from '../api';

type SDKContextValue = {
	sdk?: DDPSDK;
};

const SDKContext = createContext<SDKContextValue>({});

export const useSDK = () => {
	const context = React.useContext(SDKContext);
	if (!context.sdk) {
		throw new Error('useSDK must be used within a SDKProvider');
	}
	return context.sdk;
};

const SDKProvider = ({ children }: { serverURL: string; children: React.ReactNode }) => {
	const sdk = useMemo(() => Livechat, []);

	useEffect(() => {
		void sdk.connection.connect();
	}, [sdk]);

	return <SDKContext.Provider value={{ sdk }}>{children}</SDKContext.Provider>;
};

export default SDKProvider;
