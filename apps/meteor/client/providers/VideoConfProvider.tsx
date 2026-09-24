import { useCurrentRoutePath, useRouter, useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload, VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { ReactNode } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { VideoConfManager } from '../lib/VideoConfManager';
import { absoluteUrl } from '../lib/absoluteUrl';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups';
import { useVideoConfOpenCall } from '../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';

export type VideoConfContextProviderProps = { children: ReactNode };

/** The internal Pexip integration, whose calls are hosted by the workspace's own conference page. */
const PEXIP_PROVIDER_NAME = 'core.pexip';

const VideoConfContextProvider = ({ children }: VideoConfContextProviderProps) => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const handleOpenCall = useVideoConfOpenCall();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const logLevel = useSetting<number>('Log_Level', 0);

	useEffect(() => VideoConfManager.setLogLevel(logLevel), [logLevel]);

	useEffect(
		() =>
			VideoConfManager.on('call/join', ({ url, callId, providerName }) => {
				// Pexip runs inside the conference page rather than at its own address, so that is what opens —
				// the provider's url is for the frame in it.
				if (providerName === PEXIP_PROVIDER_NAME) {
					handleOpenCall(absoluteUrl(router.buildRoutePath({ name: 'conference', params: { id: callId } })), providerName);
					return;
				}

				handleOpenCall(url, providerName);
			}),
		[handleOpenCall, router],
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

	// The conference window is its own window, running its own copy of the app — so "am I the call window" is a
	// question this provider can answer once, for everything under it, from the only place that knows: the route.
	// Blocks that act on it are shared components and have no business knowing what a call window's address is.
	const joinDisabled = !!useCurrentRoutePath()?.startsWith('/conference/');

	const contextValue = useMemo<VideoConfContextValue>(
		() => ({
			joinDisabled,
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
		[joinDisabled],
	);

	return (
		<VideoConfContext.Provider value={contextValue}>
			{children}
			<VideoConfPopups>{outgoing}</VideoConfPopups>
		</VideoConfContext.Provider>
	);
};

export default VideoConfContextProvider;
