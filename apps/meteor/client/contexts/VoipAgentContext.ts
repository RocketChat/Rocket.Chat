import { createContext, Dispatch, SetStateAction } from 'react';

export type VoipAgentContextValue = {
	agentEnabled: boolean;
	registered: boolean;
	networkStatus: 'online' | 'offline';
	voipButtonEnabled: boolean;
	setAgentEnabled: Dispatch<SetStateAction<boolean>>;
	setRegistered: Dispatch<SetStateAction<boolean>>;
	setNetworkStatus: Dispatch<SetStateAction<'online' | 'offline'>>;
	setVoipButtonEnabled: Dispatch<SetStateAction<boolean>>;
};

export const VoipAgentContext = createContext<VoipAgentContextValue>({
	agentEnabled: false,
	registered: false,
	networkStatus: 'offline',
	voipButtonEnabled: false,
	setAgentEnabled: () => undefined,
	setRegistered: () => undefined,
	setNetworkStatus: () => undefined,
	setVoipButtonEnabled: () => undefined,
});
