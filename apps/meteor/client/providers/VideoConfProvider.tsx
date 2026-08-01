import type { CallPreferences } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload, VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { ReactNode } from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { VideoConfManager } from '../lib/VideoConfManager';
import SwitchCallModal from '../views/room/contextualBar/VideoConference/SwitchCallModal';
import VideoConfBlockModal from '../views/room/contextualBar/VideoConference/VideoConfBlockModal';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups';
import { useVideoConfOpenCall } from '../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import { getRemoteCallState, sendCallCommand } from '../views/videoConference/livekit/callBarChannel';

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
	const [switchTarget, setSwitchTarget] = useState<{ callId: string; preferences: CallPreferences; currentRoomName: string } | null>(null);

	const doOpenConference = useCallback(
		(callId: string, preferences: CallPreferences = {}, accepted = false) => {
			const url = new URL(`/conference/${callId}`, window.location.href);
			url.searchParams.set('mic', String(preferences.mic ?? true));
			url.searchParams.set('cam', String(preferences.cam ?? false));
			if (accepted) {
				// accepted incoming call: skip the pre-flight, join muted
				url.searchParams.set('autojoin', 'true');
			}

			const urlString = url.toString();
			const popup = window.open(urlString, '_blank', 'width=1280,height=800,resizable=yes');
			if (!popup) {
				setConferenceBlockUrl(urlString);
			}
		},
		[setConferenceBlockUrl],
	);

	// One call at a time: joining while another call runs in the pop-out
	// window asks stay-vs-switch here, where the click happened. Clicking
	// the call the user is already in just refocuses its window.
	const openConference = useCallback(
		(callId: string, preferences: CallPreferences = {}, accepted = false) => {
			const activeRemoteCall = getRemoteCallState();
			if (activeRemoteCall?.callId === callId) {
				sendCallCommand(callId, 'focus');
				return;
			}
			if (activeRemoteCall) {
				setSwitchTarget({ callId, preferences, currentRoomName: activeRemoteCall.roomName });
				return;
			}
			doOpenConference(callId, preferences, accepted);
		},
		[doOpenConference],
	);

	useEffect(
		() =>
			VideoConfManager.on('call/joinEmbedded', ({ callId, providerName, preferences, accepted }) => {
				if (providerName === 'livekit') {
					openConference(callId, preferences, accepted);
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
			joinCall: (callId, providerName, rid) => void VideoConfManager.joinCall(callId, providerName, rid),
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
			{switchTarget && (
				<SwitchCallModal
					currentCallRoomName={switchTarget.currentRoomName}
					onStay={() => setSwitchTarget(null)}
					onSwitch={() => {
						const target = switchTarget;
						setSwitchTarget(null);
						const activeRemoteCall = getRemoteCallState();
						if (activeRemoteCall) {
							sendCallCommand(activeRemoteCall.callId, 'hangup');
						}
						// small grace so the old window leaves before the new
						// one joins (server allows one active call per user)
						setTimeout(() => doOpenConference(target.callId, target.preferences), 500);
					}}
				/>
			)}
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
