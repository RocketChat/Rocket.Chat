import { Meteor } from 'meteor/meteor';
import { createContext, useContext } from 'react';

export type OmnichannelAgent = Meteor.User & {
	statusLivechat: OmnichannelAgentStatus;
}

export type OmnichannelAgentStatus = 'available' | 'not-available';


export type OmichannelRoutingConfig = {
	previewRoom: boolean;
	showConnecting: boolean;
	showQueue: boolean;
	showQueueLink: boolean;
	returnQueue: boolean;
	enableTriggerAction: boolean;
	autoAssignAgent: boolean;
};


export type OmnichannelContextValue = {
	enabled: boolean;
	queuedInquiries: Array<any>;
	agentAvailable: boolean;
	routeConfig?: OmichannelRoutingConfig;
	showOmnichannelQueueLink: boolean;
};

export const OmnichannelContext = createContext<OmnichannelContextValue>({
	enabled: false,
	queuedInquiries: [],
	agentAvailable: false,
	showOmnichannelQueueLink: false,
});

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
export const useOmnichannelShowQueueLink = (): boolean => useOmnichannel().showOmnichannelQueueLink;
export const useOmnichannelRouteConfig = (): OmichannelRoutingConfig | undefined => useOmnichannel().routeConfig;
export const useOmnichannelAgentAvailable = (): boolean => useOmnichannel().agentAvailable;
export const useQueuedInquiries = () => useOmnichannel().queuedInquiries;
export const useOmnichannelQueueLink = () => '/livechat-queue';
export const useOmnichannelEnabled = () => useOmnichannel().enabled;
