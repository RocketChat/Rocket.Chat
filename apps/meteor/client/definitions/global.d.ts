import type { IRocketChatDesktop } from './IRocketChatDesktop';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;

		/** @deprecated use `window.RTCPeerConnection` */
		mozRTCPeerConnection?: RTCPeerConnection;
		/** @deprecated use `window.RTCPeerConnection` */
		webkitRTCPeerConnection?: RTCPeerConnection;

		/** @deprecated use `window.RTCSessionDescription` */
		mozRTCSessionDescription?: RTCSessionDescription;
		/** @deprecated use `window.RTCSessionDescription` */
		webkitRTCSessionDescription?: RTCSessionDescription;
		/** @deprecated use `window.RTCIceCandidate` */
		mozRTCIceCandidate?: RTCIceCandidate;
		/** @deprecated use `window.RTCIceCandidate` */
		webkitRTCIceCandidate?: RTCIceCandidate;
		/** @deprecated use `window.RTCSessionDescription` */
		mozRTCSessionDescription?: RTCSessionDescription;
		/** @deprecated use `window.RTCSessionDescription` */
		webkitRTCSessionDescription?: RTCSessionDescription;
		/** @deprecated use `window.AudioContext` */
		mozAudioContext?: AudioContext;
		/** @deprecated use `window.AudioContext` */
		webkitAudioContext?: AudioContext;
	}

	interface Navigator {
		/** @deprecated */
		getUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		/** @deprecated */
		webkitGetUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		/** @deprecated */
		mozGetUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
		/** @deprecated */
		msGetUserMedia?: (
			this: Navigator,
			constraints?: MediaStreamConstraints | undefined,
			onSuccess?: (stream: MediaStream) => void,
			onError?: (error: any) => void,
		) => void;
	}

	interface RTCPeerConnection {
		/** @deprecated use `getReceivers() */
		getRemoteStreams(): MediaStream[];
		/** @deprecated */
		addStream(stream: MediaStream): void;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface MediaTrackConstraints {
		/** @deprecated */
		mozMediaSource?: string;
		/**	@deprecated */
		mediaSource?: string;
		/**	@deprecated */
		mandatory?: {
			chromeMediaSource: string;
			chromeMediaSourceId: string;
			maxWidth: number;
			maxHeight: number;
		};
	}

	interface NotificationEventMap {
		reply: { response: string };
	}
}
