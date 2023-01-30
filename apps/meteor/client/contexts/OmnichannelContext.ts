import type { OmichannelRoutingConfig, Inquiries, ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type OmnichannelContextValue = {
	inquiries: Inquiries;
	enabled: boolean;
	agentAvailable: boolean;
	routeConfig?: OmichannelRoutingConfig;
	showOmnichannelQueueLink: boolean;
	livechatPriorities: {
		data: Serialized<ILivechatPriority>[];
		isLoading: boolean;
		isError: boolean;
	};
};

export const OmnichannelContext = createContext<OmnichannelContextValue>({
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
	livechatPriorities: {
		data: [],
		isLoading: false,
		isError: false,
	},
});
