import type { OmichannelRoutingConfig, Inquiries } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type OmnichannelContextValue = {
	inquiries: Inquiries;
	enabled: boolean;
	agentAvailable: boolean;
	routeConfig?: OmichannelRoutingConfig;
	showOmnichannelQueueLink: boolean;
};

export const OmnichannelContext = createContext<OmnichannelContextValue>({
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
});
