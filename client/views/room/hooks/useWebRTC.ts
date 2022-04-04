import { useCallback, useState } from 'react';

import { WebRTC } from '../../../../app/webrtc/client';

type callParams = {
	audio: boolean;
	video: boolean;
};

export type useWebRTCProps = {
	shouldAllowCalls: boolean;
	callInProgress: boolean;
	videoAvaliable: boolean;
	showUserWebRTC: boolean;
	mainVideoUrl: () => MediaStream | void;
	screenShareEnabled: boolean;
	selfVideoUrl: MediaStream;
	audioAndVideoEnabled: boolean;
	audioEnabled: boolean;
	videoEnabled: boolean;
	remoteVideoItems: Array<MediaStream>;
	isVideoActive: () => boolean;
	handleStopCall: () => void;
	screenShareAvailable: boolean;
	toggleScreenShare: () => void;
	toggleOverlay: () => void;
	toggleVideo: () => void;
	toggleAudio: () => void;
	overlayEnabled: boolean;
	joinCall: (params: callParams) => void;
	startCall: (params: callParams) => void;
	mainVideo: string;
	setMainVideo: (value: string) => void;
};

export const useWebRTC = (rid: string): useWebRTCProps => {
	const getWebRTCInstance = useCallback(() => WebRTC.getInstanceByRoomId(rid), [rid]);
	const webRTCInstance = getWebRTCInstance();
	const videoAvaliable = webRTCInstance != null;

	const [mainVideo, setMainVideo] = useState<string>('$auto');

	const getShouldAllowCalls = (): boolean => {
		if (!webRTCInstance) {
			return false;
		}

		const { localUrl, remoteItems } = webRTCInstance;
		const r = remoteItems.get() || [];
		if (localUrl.get() === null && r.length === 0) {
			return false;
		}

		return true;
	};

	const isVideoActive = (): boolean => {
		let { remoteItems } = getWebRTCInstance();
		const { localUrl } = getWebRTCInstance();
		remoteItems = remoteItems.get() || [];
		return localUrl.get() != null || remoteItems.length > 0;
	};

	const mainVideoUrl = (): void => {
		if (mainVideo === '$self') {
			return webRTCInstance?.localUrl.get();
		}

		if (mainVideo === '$auto') {
			const remoteItems = webRTCInstance?.remoteItems.get() || [];
			if (remoteItems.length > 0) {
				return remoteItems[0].url;
			}
			return webRTCInstance?.localUrl.get();
		}

		if (webRTCInstance?.remoteItemsById.get()[mainVideo] != null) {
			return webRTCInstance?.remoteItemsById.get()[mainVideo].url;
		}

		setMainVideo('$auto');
	};

	const showUserWebRTC = videoAvaliable && isVideoActive();

	const shouldAllowCalls = getShouldAllowCalls();
	const callInProgress = webRTCInstance?.callInProgress.get();
	const overlayEnabled = webRTCInstance?.overlayEnabled.get();
	const audioEnabled = webRTCInstance?.audioEnabled.get();
	const videoEnabled = webRTCInstance?.videoEnabled.get();
	const audioAndVideoEnabled = webRTCInstance?.audioEnabled.get() && webRTCInstance?.videoEnabled.get();

	const screenShareEnabled = webRTCInstance?.screenShareEnabled.get();
	const remoteVideoItems = webRTCInstance?.remoteItems.get();
	const selfVideoUrl = webRTCInstance?.localUrl.get();

	const handleStopCall = (): void => webRTCInstance?.stop();
	const toggleOverlay = (): void => (overlayEnabled ? webRTCInstance?.overlayEnabled.set(false) : webRTCInstance?.overlayEnabled.set(true));
	const toggleScreenShare = (): void => (screenShareEnabled ? webRTCInstance?.disableScreenShare() : webRTCInstance?.enableScreenShare());
	const toggleVideo = (): void => (videoEnabled ? webRTCInstance?.disableVideo() : webRTCInstance?.enableVideo());
	const toggleAudio = (): void => (audioEnabled ? webRTCInstance?.disableAudio() : webRTCInstance?.enableAudio());

	const joinCall = (params: callParams): void => webRTCInstance?.joinCall(params);
	const startCall = (params: callParams): void => webRTCInstance?.startCall(params);

	return {
		shouldAllowCalls,
		callInProgress,
		videoAvaliable,
		showUserWebRTC,
		mainVideoUrl,
		screenShareEnabled,
		selfVideoUrl,
		audioAndVideoEnabled,
		audioEnabled,
		videoEnabled,
		remoteVideoItems,
		isVideoActive,
		handleStopCall,
		screenShareAvailable: webRTCInstance?.screenShareAvailable,
		toggleScreenShare,
		toggleOverlay,
		toggleVideo,
		toggleAudio,
		overlayEnabled,
		joinCall,
		startCall,
		mainVideo,
		setMainVideo,
	};
};
