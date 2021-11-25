import { createContext, useContext } from 'react';

import { OmichannelRoutingConfig, Inquiries } from '../../definition/OmichannelRoutingConfig';
import { IRegistrationInfo } from '../components/voip/IRegistrationInfo';
import { VoIPUser } from '../components/voip/VoIPUser';

export type OmnichannelContextValue = {
	inquiries: Inquiries;
	enabled: boolean;
	agentAvailable: boolean;
	voipCallAvailable: boolean;
	routeConfig?: OmichannelRoutingConfig;
	showOmnichannelQueueLink: boolean;
} & (
	| {
			registrationConfig: IRegistrationInfo;
			voipUser: VoIPUser;
	  }
	| {
			voipUser: undefined;
	  }
);

export const OmnichannelContext = createContext<OmnichannelContextValue>({
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	voipCallAvailable: false,
	showOmnichannelQueueLink: false,
	voipUser: undefined,
});

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
export const useOmnichannelShowQueueLink = (): boolean => useOmnichannel().showOmnichannelQueueLink;
export const useOmnichannelRouteConfig = (): OmichannelRoutingConfig | undefined =>
	useOmnichannel().routeConfig;

export const useVoipUser = (): VoIPUser | undefined => {
	const { voipUser } = useOmnichannel();
	return voipUser;
};

export const useIsVoipLibReady = (): boolean => {
	const { voipUser } = useOmnichannel();

	if (!voipUser) {
		throw new Error('useRegistrationInfo should be used in a safe scope here voipUser exists');
	}

	return Boolean(voipUser.isReady());
};

export const useRegistrationInfo = (): IRegistrationInfo => {
	const context = useOmnichannel();

	if (!context.voipUser) {
		throw new Error('useRegistrationInfo should be used in a safe scope here voipUser exists');
	}
	return context.registrationConfig;
};

export const useOmnichannelAgentAvailable = (): boolean => useOmnichannel().agentAvailable;
export const useOmnichannelVoipCallAvailable = (): boolean => useOmnichannel().voipCallAvailable;
export const useQueuedInquiries = (): Inquiries => useOmnichannel().inquiries;
export const useOmnichannelQueueLink = (): string => '/livechat-queue';
export const useOmnichannelDirectoryLink = (): string => '/omnichannel-directory';
export const useOmnichannelEnabled = (): boolean => useOmnichannel().enabled;
