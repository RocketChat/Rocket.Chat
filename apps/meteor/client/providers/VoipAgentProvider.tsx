import React, { FC, useState } from 'react';

import { VoipAgentContext } from '../contexts/VoipAgentContext';

const VoipAgentProvider: FC = ({ children }) => {
	const [agentEnabled, setAgentEnabled] = useState(false);
	const [registered, setRegistered] = useState(false);
	const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
	const [voipButtonEnabled, setVoipButtonEnabled] = useState(false);

	return (
		<VoipAgentContext.Provider
			children={children}
			value={{
				agentEnabled,
				registered,
				networkStatus,
				voipButtonEnabled,
				setAgentEnabled,
				setRegistered,
				setNetworkStatus,
				setVoipButtonEnabled,
			}}
		/>
	);
};

export default VoipAgentProvider;
