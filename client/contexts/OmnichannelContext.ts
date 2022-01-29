import { createContext, useContext } from 'react';

import { OmichannelRoutingConfig, Inquiries } from '../../definition/OmichannelRoutingConfig';

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

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
export const useOmnichannelShowQueueLink = (): boolean => useOmnichannel().showOmnichannelQueueLink;
export const useOmnichannelRouteConfig = (): OmichannelRoutingConfig | undefined => useOmnichannel().routeConfig;
export const useOmnichannelAgentAvailable = (): boolean => useOmnichannel().agentAvailable;
export const useQueuedInquiries = (): Inquiries => useOmnichannel().inquiries;
export const useOmnichannelEnabled = (): boolean => useOmnichannel().enabled;
