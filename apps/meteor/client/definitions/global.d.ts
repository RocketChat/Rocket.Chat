import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';

declare global {
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;

		// Bridge injected into the desktop app's internal video-chat window (separate from
		// `RocketChatDesktop`, which is only present in the main app webview).
		videoCallWindow?: {
			// Navigate the main app window to an in-app route (e.g. "/channel/general") and focus it.
			openInMainWindow?: (path: string) => void;
			// Close the conference window (renderer `window.close()` can't close a main-process window).
			close?: () => void;
		};

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
