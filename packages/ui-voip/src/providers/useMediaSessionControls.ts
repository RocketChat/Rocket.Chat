import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useMemo } from 'react';

import { getEndCall } from '../utils/instanceControlsGetters';

export type MediaSessionControls = {
	toggleMute: () => void;
	toggleHold: () => void;
	endCall: () => void;
	startCall: (id: string, kind: 'user' | 'sip') => Promise<void>;
	acceptCall: () => void;
	changeDevice: (deviceId: string) => Promise<void>;
	forwardCall: (type: 'user' | 'sip', id: string) => void;
	sendTone: (tone: string) => void;
	toggleScreenSharing: () => void;
};

export const useMediaSessionControls = (instance?: MediaSignalingSession): MediaSessionControls => {
	return useMemo(() => {
		const toggleMute = () => {
			const mainCall = instance?.getMainCall();
			if (!mainCall) {
				return;
			}
			mainCall.setMuted(!mainCall.muted);
		};

		const toggleHold = () => {
			const mainCall = instance?.getMainCall();
			if (!mainCall) {
				return;
			}
			mainCall.setHeld(!mainCall.held);
		};

		const endCall = getEndCall(instance);

		const acceptCall = () => {
			if (!instance) {
				return;
			}
			const call = instance.getMainCall();
			if (call?.state !== 'ringing') {
				return;
			}
			call.accept();
		};

		const startCall = async (id: string, kind: 'user' | 'sip') => {
			if (!instance) {
				return;
			}
			try {
				await instance.startCall(kind, id);
			} catch (error) {
				console.error('Error starting call', error);
			}
		};

		const changeDevice = async (deviceId: string) => {
			if (!instance) {
				return;
			}
			void instance.setDeviceId({ exact: deviceId });
		};

		const forwardCall = (type: 'user' | 'sip', id: string) => {
			if (!instance) {
				return;
			}
			const mainCall = instance.getMainCall();
			if (!mainCall) {
				return;
			}
			mainCall.transfer({ type, id });
		};

		const sendTone = (tone: string) => {
			if (!instance) {
				return;
			}
			const mainCall = instance.getMainCall();
			if (!mainCall) {
				return;
			}
			try {
				mainCall.sendDTMF(tone);
			} catch (error) {
				console.error('Error sending tone', error);
			}
		};

		const toggleScreenSharing = () => {
			if (!instance) {
				return;
			}

			const mainCall = instance.getMainCall();
			if (!mainCall) {
				return;
			}

			try {
				mainCall.requestScreenShare(!mainCall.hasScreenVideoTrack());
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
			sendTone,
		};
	}, [instance]);
};
