import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';

declare global {
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;
		opera?: string;
	}

	interface Navigator {
		/** @deprecated use the newer `navigator.mediaDevices.getUserMedia()` instead */
		getUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		/** @deprecated use the newer `navigator.mediaDevices.getUserMedia()` instead */
		webkitGetUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		/** @deprecated use the newer `navigator.mediaDevices.getUserMedia()` instead */
		mozGetUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		/** @deprecated use the newer `navigator.mediaDevices.getUserMedia()` instead */
		msGetUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		userAgentData?: {
			mobile: boolean;
		};
	}

	interface NotificationEventMap {
		reply: { response: string };
	}
}
