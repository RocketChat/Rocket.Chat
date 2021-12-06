import React, { useMemo, FC, useRef } from 'react';
import { createPortal } from 'react-dom';

import { IMediaStreamRenderer } from '../../components/voip/VoIPUserConfiguration';
import { CallContext, CallContextValue } from '../../contexts/CallContext';
import { createAnchor } from '../../lib/utils/createAnchor';
import {
	isUseVoipClientResultError,
	isUseVoipClientResultLoading,
	useVoipClient,
} from './hooks/useVoipClient';

export const CallProvider: FC = ({ children }) => {
	// TODO: Test Settings and return false if its disabled (based on the settings)
	const result = useVoipClient();

	// type CallContextReady = {
	// 	enabled: true;
	// 	ready: true;
	// 	registrationInfo: IRegistrationInfo; // TODO: Remove after delete the example
	// 	voipClient: VoIPUser;
	// 	actions: CallActions;
	// };

	const remoteAudioMediaRef = useRef<HTMLAudioElement>(new Audio()); // TODO: Create a dedicated file for the AUDIO and make the controlls accessible

	const audioElement = <audio id='remote_media' ref={remoteAudioMediaRef} />;

	const mediaRenderer = useMemo<IMediaStreamRenderer>(
		() => ({ remoteMediaElement: remoteAudioMediaRef.current as HTMLMediaElement }),
		[remoteAudioMediaRef],
	);

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
				pickUp: (): Promise<unknown> => voipClient.acceptCall(mediaRenderer),
				reject: (): Promise<unknown> => voipClient.rejectCall(),
			},
			remoteAudioMediaRef,
		};
	}, [mediaRenderer, result]);
	return (
		<CallContext.Provider value={contextValue}>
			{children}
			<AudioTagPortal>{audioElement}</AudioTagPortal>
		</CallContext.Provider>
	);
};
