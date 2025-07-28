import { useContext, useMemo } from 'react';

import type { VoipContextReady } from '../contexts/VoipContext';
import { VoipContext, isVoipContextReady } from '../contexts/VoipContext';
import MediaCallsClient from '../lib/MediaCallsClient';

type VoipAPI = {
	makeCall(callee: { uid?: string; rid?: string; extension?: string } | string): void;
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

		// Workaround to use the MediaCallsClient with the VoipContext for now
		if (voipClient && voipClient instanceof MediaCallsClient) {
			const mediaCallsClient = voipClient as MediaCallsClient;

			return {
				makeCall: (callee) => {
					if (typeof callee === 'string') {
						return mediaCallsClient.call({ extension: callee });
					}

					return mediaCallsClient.call(callee);
				},
				endCall: () => mediaCallsClient.endCall(),
				register: NOOP,
				unregister: NOOP,
				transferCall: mediaCallsClient.transfer,
				openDialer: () => mediaCallsClient.notifyDialer({ open: true }),
				closeDialer: () => mediaCallsClient.notifyDialer({ open: false }),
				changeAudioInputDevice,
				changeAudioOutputDevice,
				onRegisteredOnce: NOOP,
				onUnregisteredOnce: NOOP,
			};
		}

		return {
			makeCall: (callee) => {
				if (typeof callee === 'string') {
					return voipClient.call(callee);
				}
				return voipClient.call(callee.extension as string);
			},
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
