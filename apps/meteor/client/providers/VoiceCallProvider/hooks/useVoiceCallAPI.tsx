import { useContext, useMemo } from 'react';

import type { VoiceCallContextReady } from '../../../contexts/VoiceCallContext';
import { VoiceCallContext, isVoiceCallContextReady } from '../../../contexts/VoiceCallContext';

type VoiceCallAPI = {
	makeCall(calleeURI: string): void;
	endCall(): void;
	register(): Promise<void>;
	unregister(): Promise<void>;
	openDialer(): void;
	closeDialer(): void;
	transferCall(calleeURL: string): Promise<void>;
	changeAudioOutputDevice: VoiceCallContextReady['changeAudioOutputDevice'];
	changeAudioInputDevice: VoiceCallContextReady['changeAudioInputDevice'];
};

const NOOP = (..._args: any[]): any => undefined;

export const useVoiceCallAPI = (): VoiceCallAPI => {
	const context = useContext(VoiceCallContext);

	return useMemo(() => {
		if (!isVoiceCallContextReady(context)) {
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
			} as VoiceCallAPI;
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
		};
	}, [context]);
};

export default useVoiceCallAPI;
