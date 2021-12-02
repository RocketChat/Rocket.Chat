import React, { useMemo, FC } from 'react';

import { CallContext } from '../../contexts/CallContext';
import { useVoipClient } from './hooks/useVoipClient';

const CallProvider: FC = ({ children }) => {
	const [voipClient, registrationInfo] = useVoipClient();

	const contextValue = useMemo(() => {
		// TODO: Test Settings and return false if its disabled (based on the settings)
		if (!voipClient || !registrationInfo) {
			return {
				enabled: true,
				ready: false,
			};
		}

		return {
			enabled: true,
			ready: true,
			registrationInfo,
			voipClient,
			actions: {
				mute: (): void => undefined, // voipClient.mute(),
				unmute: (): void => undefined, // voipClient.unmute()
				pause: (): void => undefined, // voipClient.pause()
				resume: (): void => undefined, // voipClient.resume()
				end: (): Promise<unknown> => voipClient.endCall(),
				pickUp: (): Promise<unknown> => voipClient.acceptCall(),
				reject: (): Promise<unknown> => voipClient.rejectCall(),
			},
		};
	}, [voipClient, registrationInfo]);
	return <CallContext.Provider children={children} value={contextValue} />;
};

export default CallProvider;
