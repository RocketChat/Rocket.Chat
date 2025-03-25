import { useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload, VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { ReactElement, ReactNode } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { VideoConfManager } from '../lib/VideoConfManager';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups';
import { useVideoConfOpenCall } from '../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const handleOpenCall = useVideoConfOpenCall();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const logLevel = useSetting<number>('Log_Level', 0);

	useEffect(() => VideoConfManager.setLogLevel(logLevel), [logLevel]);

	useEffect(
		() =>
			VideoConfManager.on('call/join', (props) => {
				handleOpenCall(props.url, props.providerName);
			}),
		[handleOpenCall],
	);

	useEffect(
		() =>
			VideoConfManager.on('error', (props) => {
				const message = t(props.error?.startsWith('error-') ? props.error : 'error-videoconf-unexpected');
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
			startCall: (rid, confTitle) => VideoConfManager.startCall(rid, confTitle),
			acceptCall: (callId) => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId) => VideoConfManager.joinCall(callId),
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
			<VideoConfPopups>{outgoing}</VideoConfPopups>
		</VideoConfContext.Provider>
	);
};

export default VideoConfContextProvider;
