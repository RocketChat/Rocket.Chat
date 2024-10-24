import { useContext, useMemo } from 'react';

import type { VoipContextReady } from '../contexts/VoipContext';
import { VoipContext, isVoipContextReady } from '../contexts/VoipContext';

type VoipAPI = {
	makeCall(calleeURI: string): void;
	endCall(): void;
	register(): Promise<void>;
	unregister(): Promise<void>;
	openDialer(): void;
	closeDialer(): void;
	onRegisteredOnce(cb: () => void): () => void;
	onUnregisteredOnce(cb: () => void): () => void;
	transferCall(calleeURL: string): Promise<void>;
	changeAudioOutputDevice: VoipContextReady['changeAudioOutputDevice'];
	changeAudioInputDevice: VoipContextReady['changeAudioInputDevice'];
};

const NOOP = (..._args: any[]): any => undefined;

export const useVoipAPI = (): VoipAPI => {
	const context = useContext(VoipContext);

	return useMemo(() => {
		if (!isVoipContextReady(context)) {
			return {
				makeCall: NOOP,
				endCall: NOOP,
				register: NOOP,
				unregister: NOOP,
				openDialer: NOOP,
				closeDialer: NOOP,
				transferCall: NOOP,
				changeAudioInputDevice: NOOP,
				changeAudioOutputDevice: NOOP,
				onRegisteredOnce: NOOP,
				onUnregisteredOnce: NOOP,
			} as VoipAPI;
		}

		const { voipClient, changeAudioInputDevice, changeAudioOutputDevice } = context;

		return {
			makeCall: voipClient.call,
			endCall: voipClient.endCall,
			register: voipClient.register,
			unregister: voipClient.unregister,
			transferCall: voipClient.transfer,
			openDialer: () => voipClient.notifyDialer({ open: true }),
			closeDialer: () => voipClient.notifyDialer({ open: false }),
			changeAudioInputDevice,
			changeAudioOutputDevice,
			onRegisteredOnce: (cb: () => void) => voipClient.once('registered', cb),
			onUnregisteredOnce: (cb: () => void) => voipClient.once('unregistered', cb),
		};
	}, [context]);
};
