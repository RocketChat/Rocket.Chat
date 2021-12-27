import React, { useMemo, FC, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CallContext, CallContextValue } from '../../contexts/CallContext';
import {
	isUseVoipClientResultError,
	isUseVoipClientResultLoading,
	useVoipClient,
} from './hooks/useVoipClient';

export const CallProvider: FC = ({ children }) => {
	// TODO: Test Settings and return false if its disabled (based on the settings)
	const result = useVoipClient();

	const remoteAudioMediaRef = useRef<HTMLAudioElement>(null); // TODO: Create a dedicated file for the AUDIO and make the controls accessible

	const AudioTagPortal: FC = ({ children }) =>
		useMemo(() => createPortal(children, document.body), [children]);

	const contextValue: CallContextValue = useMemo(() => {
		if (isUseVoipClientResultError(result)) {
			return {
				enabled: true,
				ready: false,
				error: result.error,
			};
		}
		if (isUseVoipClientResultLoading(result)) {
			return {
				enabled: true,
				ready: false,
			};
		}

		const { registrationInfo, voipClient } = result;

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
				pickUp: async (): Promise<unknown> =>
					remoteAudioMediaRef.current &&
					voipClient.acceptCall({ remoteMediaElement: remoteAudioMediaRef.current }),
				reject: (): Promise<unknown> => voipClient.rejectCall(),
			},
		};
	}, [result]);
	return (
		<CallContext.Provider value={contextValue}>
			{children}
			{contextValue.enabled && (
				<AudioTagPortal>
					<audio ref={remoteAudioMediaRef} />
				</AudioTagPortal>
			)}
		</CallContext.Provider>
	);
};
