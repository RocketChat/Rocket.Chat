import { useRouter, useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import type { VideoConfPopupPayload, VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { ReactNode } from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { VideoConfManager } from '../lib/VideoConfManager';
import { absoluteUrl } from '../lib/absoluteUrl';
import { useConferenceWindowEnabled } from '../views/conference/hooks/useConferenceWindowEnabled';
import { NEW_CONFERENCE_ID } from '../views/conference/lib/callWindow';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups';
import { useLeaveCallOnWindowClose } from '../views/room/contextualBar/VideoConference/hooks/useLeaveCallOnWindowClose';
import { useVideoConfOpenCall } from '../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';

export type VideoConfContextProviderProps = { children: ReactNode };

const VideoConfContextProvider = ({ children }: VideoConfContextProviderProps) => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const handleOpenCall = useVideoConfOpenCall();
	const watchCallWindow = useLeaveCallOnWindowClose();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();
	const { t } = useTranslation();
	const logLevel = useSetting<number>('Log_Level', 0);
	const conferenceWindowEnabled = useConferenceWindowEnabled();

	useEffect(() => VideoConfManager.setLogLevel(logLevel), [logLevel]);

	// The manager decides whether to ring, whether to post the join and whether a decline is recorded, so it
	// needs the setting too — the non-React half of the same gate every hook below reads.
	useEffect(() => VideoConfManager.setConferenceWindowEnabled(conferenceWindowEnabled), [conferenceWindowEnabled]);

	useEffect(
		() =>
			VideoConfManager.on('call/join', ({ url, callId, providerName }) => {
				// Without the call window, the provider's own URL is opened, exactly as before.
				if (!conferenceWindowEnabled) {
					handleOpenCall(url ?? '', providerName);
					return;
				}

				// With it, open the in-product conference page — the provider's call embedded beside the
				// conference's chat — instead of handing the user off to the provider's own page.
				const target = handleOpenCall(absoluteUrl(router.buildRoutePath({ name: 'conference', params: { id: callId } })), providerName);

				// The conference page posts the join itself, after its preflight, so the user counts as being in the
				// call from then on. If that window goes away before it can report its own departure, this is what
				// does it for them.
				watchCallWindow(callId, target);
			}),
		[handleOpenCall, router, conferenceWindowEnabled, watchCallWindow],
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

	/**
	 * Placing a call, once the user has asked for one.
	 *
	 * With the call window, this only opens it: the conference is created by the preflight inside, because creating
	 * one posts a message in the room, rings people and writes a call into everyone's history — none of which
	 * should happen for a call the user may still walk away from. Without it there is no preflight to wait for, so
	 * the manager starts the conference here as it always has.
	 */
	const startCall = useCallback(
		(rid: string, confTitle?: string) => {
			if (!conferenceWindowEnabled) {
				void VideoConfManager.startCall(rid, confTitle);
				return;
			}

			handleOpenCall(absoluteUrl(router.buildRoutePath({ name: 'conference', params: { id: NEW_CONFERENCE_ID }, search: { rid } })));
		},
		[handleOpenCall, conferenceWindowEnabled, router],
	);

	const contextValue = useMemo<VideoConfContextValue>(
		() => ({
			dispatchOutgoing: (option) => setOutgoing({ ...option, id: option.rid }),
			dismissOutgoing: () => setOutgoing(undefined),
			startCall,
			acceptCall: (callId) => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId) => VideoConfManager.joinCall(callId),
			dismissCall: (callId) => VideoConfManager.dismissIncomingCall(callId),
			rejectIncomingCall: (callId) => VideoConfManager.rejectIncomingCall(callId),
			abortCall: () => VideoConfManager.abortCall(),
			setPreferences: (prefs) => VideoConfManager.setPreferences(prefs),
			loadCapabilities: () => VideoConfManager.loadCapabilities(),
			queryIncomingCalls: () => [(cb) => VideoConfManager.on('incoming/changed', cb), () => VideoConfManager.getIncomingCalls()],
			queryRinging: () => [(cb) => VideoConfManager.on('ringing/changed', cb), () => VideoConfManager.isRinging()],
			queryCalling: () => [(cb) => VideoConfManager.on('calling/changed', cb), () => VideoConfManager.isCalling()],
			queryCapabilities: () => [(cb) => VideoConfManager.on('capabilities/changed', cb), () => VideoConfManager.capabilities],
			queryPreferences: () => [(cb) => VideoConfManager.on('preference/changed', cb), () => VideoConfManager.preferences],
		}),
		[startCall],
	);

	return (
		<VideoConfContext.Provider value={contextValue}>
			{children}
			<VideoConfPopups>{outgoing}</VideoConfPopups>
		</VideoConfContext.Provider>
	);
};

export default VideoConfContextProvider;
