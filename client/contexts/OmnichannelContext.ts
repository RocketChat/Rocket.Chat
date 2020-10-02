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

type Inquiries = {
	enabled: true;
	queue: Array<any>;
} | {
	enabled: false;
}



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
export const useOmnichannelQueueLink = () => '/livechat-queue';
export const useOmnichannelEnabled = () => useOmnichannel().enabled;
