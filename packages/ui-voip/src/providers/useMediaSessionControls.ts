import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { stopTracks, useDevicePermissionPrompt2 } from '@rocket.chat/ui-media';
import { useMemo } from 'react';

import { getEndCall } from '../utils/instanceControlsGetters';

export type MediaSessionControls = {
	toggleMute: () => void;
	toggleHold: () => void;
	endCall: () => void;
	startCall: (id: string, kind: 'user' | 'sip', micless: boolean) => Promise<void>;
	acceptCall: (micless: boolean) => void;
	changeDevice: (deviceId: string) => Promise<void>;
	forwardCall: (type: 'user' | 'sip', id: string) => void;
	swapCalls: () => void;
	consultBeforeTransfer: (type: 'user' | 'sip', id: string) => Promise<void>;
	sendTone: (tone: string) => void;
	toggleScreenSharing: () => void;
};

export const useMediaSessionControls = (instance?: MediaSignalingSession): MediaSessionControls => {
	const requestDevice = useDevicePermissionPrompt2();
	return useMemo(() => {
		const toggleMute = () => {
			const instanceState = instance?.getState();
			if (!instanceState || !instance) {
				return;
			}
			if (instance.micless) {
				void requestDevice({ actionType: 'device-change' })
					.then(async (stream: MediaStream) => {
						stopTracks(stream);
						const inputTrack = stream.getAudioTracks()[0];
						if (!inputTrack) {
							return;
						}
						const { deviceId } = inputTrack.getSettings();
						if (!deviceId) {
							return;
						}

						instance.micless = false;
						await changeDevice(deviceId, true);
					})
					.then(() => {
						if (!instance.micless) {
							instance.getState()?.localParticipant.setMuted(false);
						}
					})
					.catch((e) => {
						console.error('useMediaSessionControls - failed to enable microphone:', e);
						instance.micless = true;
					});
				return;
			}
			instanceState.localParticipant.setMuted(!instanceState.localParticipant.muted);
		};

		const toggleHold = () => {
			const instanceState = instance?.getState();
			if (!instanceState) {
				return;
			}
			instanceState.localParticipant.setHeld(!instanceState.localParticipant.held);
		};

		const endCall = getEndCall(instance);

		const acceptCall = (micless: boolean) => {
			if (!instance) {
				return;
			}
			const instanceState = instance.getState();
			if (!instanceState?.confirmed || instanceState.state !== 'ringing') {
				return;
			}
			instance.micless = micless;
			instanceState.call.accept();
		};

		const startCall = async (id: string, kind: 'user' | 'sip', micless: boolean) => {
			if (!instance) {
				return;
			}
			try {
				instance.micless = micless;
				await instance.startCall(kind, id);
			} catch (error) {
				console.error('Error starting call', error);
			}
		};

		const changeDevice = async (deviceId: string, force?: boolean) => {
			if (!instance) {
				return;
			}
			await instance.setDeviceId({ exact: deviceId }, force || false);
		};

		const forwardCall = (type: 'user' | 'sip', id: string) => {
			if (!instance) {
				return;
			}
			const instanceState = instance.getState();
			if (!instanceState?.confirmed) {
				return;
			}
			instanceState.call.transfer({ type, id });
		};

		const swapCalls = () => {
			try {
				instance?.swapCalls();
			} catch (error) {
				console.error('Error switching calls', error);
			}
		};

		const consultBeforeTransfer = async (type: 'user' | 'sip', id: string) => {
			if (!instance) {
				return;
			}

			try {
				await instance.startAttendedTransfer(type, id);
			} catch (error) {
				console.error('Error starting attended transfer', error);
			}
		};

		const sendTone = (tone: string) => {
			if (!instance) {
				return;
			}
			const instanceState = instance.getState();
			if (!instanceState?.confirmed) {
				return;
			}

			try {
				instanceState.call.sendDTMF(tone);
			} catch (error) {
				console.error('Error sending tone', error);
			}
		};

		const toggleScreenSharing = () => {
			if (!instance) {
				return;
			}

			const instanceState = instance.getState();
			if (!instanceState?.confirmed) {
				return;
			}

			try {
				instanceState.call.requestScreenShare(!instanceState.call.hasScreenVideoTrack());
			} catch (error) {
				console.error('Error toggling screen share', error);
			}
		};

		return {
			toggleMute,
			toggleHold,
			toggleScreenSharing,
			endCall,
			startCall,
			acceptCall,
			changeDevice,
			forwardCall,
			swapCalls,
			consultBeforeTransfer,
			sendTone,
		};
	}, [instance, requestDevice]);
};
