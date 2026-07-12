import type { CallPreferences } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload, VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { ReactNode } from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { VideoConfManager } from '../lib/VideoConfManager';
import VideoConfBlockModal from '../views/room/contextualBar/VideoConference/VideoConfBlockModal';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups';
import { useVideoConfOpenCall } from '../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';

export type VideoConfContextProviderProps = { children: ReactNode };

const VideoConfContextProvider = ({ children }: VideoConfContextProviderProps) => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const [conferenceBlockUrl, setConferenceBlockUrl] = useState<string | null>(null);
	const handleOpenCall = useVideoConfOpenCall();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const logLevel = useSetting<number>('Log_Level', 0);

	useEffect(() => VideoConfManager.setLogLevel(logLevel), [logLevel]);

	useEffect(
		() =>
			VideoConfManager.on('call/join', ({ url, providerName }) => {
				handleOpenCall(url, providerName);
			}),
		[handleOpenCall],
	);

	// Embedded providers (LiveKit) are opened in a dedicated /conference/:id
	// window with the persistent chat on the left, instead of mounting inline
	// in the room. The conference page takes over the embedded provider context.
	const openConference = useCallback(
		(callId: string, preferences: CallPreferences = {}) => {
			const url = new URL(`/conference/${callId}`, window.location.href);
			url.searchParams.set('mic', String(preferences.mic ?? true));
			url.searchParams.set('cam', String(preferences.cam ?? false));

			const urlString = url.toString();
			const popup = window.open(urlString, '_blank', 'width=1280,height=800,resizable=yes');
			if (!popup) {
				setConferenceBlockUrl(urlString);
			}
		},
		[setConferenceBlockUrl],
	);

	useEffect(
		() =>
			VideoConfManager.on('call/joinEmbedded', ({ callId, providerName, preferences }) => {
				if (providerName === 'livekit') {
					openConference(callId, preferences);
				}
			}),
		[openConference],
	);

	useEffect(
		() =>
			VideoConfManager.on('error', ({ error }) => {
				const message = t(error?.startsWith('error-') ? error : 'error-videoconf-unexpected');
				dispatchToastMessage({ type: 'error', message });
			}),
		[dispatchToastMessage, t],
	);

	useEffect(() => {
		VideoConfManager.on('direct/stopped', () => setOutgoing(undefined));
		VideoConfManager.on('calling/ended', () => setOutgoing(undefined));
	}, []);

	const contextValue = useMemo<VideoConfContextValue>(
		() => ({
			dispatchOutgoing: (option) => setOutgoing({ ...option, id: option.rid }),
			dismissOutgoing: () => setOutgoing(undefined),
			startCall: (rid, confTitle) => void VideoConfManager.startCall(rid, confTitle),
			acceptCall: (callId) => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId) => void VideoConfManager.joinCall(callId),
			dismissCall: (callId) => VideoConfManager.dismissIncomingCall(callId),
			rejectIncomingCall: (callId) => VideoConfManager.rejectIncomingCall(callId),
			abortCall: () => VideoConfManager.abortCall(),
			setPreferences: (prefs) => VideoConfManager.setPreferences(prefs),
			loadCapabilities: () => VideoConfManager.loadCapabilities(),
			queryIncomingCalls: () => [(cb) => VideoConfManager.on('incoming/changed', cb), () => VideoConfManager.getIncomingDirectCalls()],
			queryRinging: () => [(cb) => VideoConfManager.on('ringing/changed', cb), () => VideoConfManager.isRinging()],
			queryCalling: () => [(cb) => VideoConfManager.on('calling/changed', cb), () => VideoConfManager.isCalling()],
			queryCapabilities: () => [(cb) => VideoConfManager.on('capabilities/changed', cb), () => VideoConfManager.capabilities],
			queryPreferences: () => [(cb) => VideoConfManager.on('preference/changed', cb), () => VideoConfManager.preferences],
		}),
		[],
	);

	return (
		<VideoConfContext.Provider value={contextValue}>
			{children}
			{conferenceBlockUrl && (
				<VideoConfBlockModal
					onClose={() => setConferenceBlockUrl(null)}
					onConfirm={() => {
						void window.open(conferenceBlockUrl, '_blank', 'width=1280,height=800,resizable=yes');
						setConferenceBlockUrl(null);
					}}
				/>
			)}
			<VideoConfPopups>{outgoing}</VideoConfPopups>
		</VideoConfContext.Provider>
	);
};

export default VideoConfContextProvider;
