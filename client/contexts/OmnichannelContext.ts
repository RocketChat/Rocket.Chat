import { createContext, useContext } from 'react';

import { OmichannelRoutingConfig, Inquiries } from '../../definition/OmichannelRoutingConfig';
import { IRegistrationInfo } from '../components/voip/IRegistrationInfo';
import { SimpleVoipUser } from '../components/voip/SimpleVoipUser';

export type OmnichannelContextValue = {
	inquiries: Inquiries;
	enabled: boolean;
	agentAvailable: boolean;
	voipCallAvailable: boolean;
	routeConfig?: OmichannelRoutingConfig;
	showOmnichannelQueueLink: boolean;
	registrationConfig?: IRegistrationInfo;
	voipUser?: SimpleVoipUser;
};

export const OmnichannelContext = createContext<OmnichannelContextValue>({
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	voipCallAvailable: false,
	showOmnichannelQueueLink: false,
});

export const useOmnichannel = (): OmnichannelContextValue => useContext(OmnichannelContext);
export const useOmnichannelShowQueueLink = (): boolean => useOmnichannel().showOmnichannelQueueLink;
export const useOmnichannelRouteConfig = (): OmichannelRoutingConfig | undefined =>
	useOmnichannel().routeConfig;
export const useIsVoipLibReady = (): boolean | undefined => useOmnichannel().voipUser?.isReady();
export const useVoipUser = (): SimpleVoipUser | undefined => {
	const { voipUser } = useOmnichannel();
	if (useOmnichannel().voipUser?.isReady()) {
		return voipUser;
	}
};

export const useRegistrationInfo = (): IRegistrationInfo | undefined => {
	const { registrationConfig: extensionConfig } = useOmnichannel();
	if (useOmnichannel().voipUser?.isReady()) {
		return extensionConfig;
	}
};

export const useOmnichannelAgentAvailable = (): boolean => useOmnichannel().agentAvailable;
export const useOmnichannelVoipCallAvailable = (): boolean => useOmnichannel().voipCallAvailable;
export const useQueuedInquiries = (): Inquiries => useOmnichannel().inquiries;
export const useOmnichannelQueueLink = (): string => '/livechat-queue';
export const useOmnichannelDirectoryLink = (): string => '/omnichannel-directory';
export const useOmnichannelEnabled = (): boolean => useOmnichannel().enabled;
