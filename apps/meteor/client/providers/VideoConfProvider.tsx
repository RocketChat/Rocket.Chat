import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactElement, ReactNode } from 'react';
import React, { useState, useMemo, useEffect } from 'react';
import type { Unsubscribe } from 'use-subscription';

import type { VideoConfPopupPayload } from '../contexts/VideoConfContext';
import { VideoConfContext } from '../contexts/VideoConfContext';
import type { DirectCallData, ProviderCapabilities, CallPreferences } from '../lib/VideoConfManager';
import { VideoConfManager } from '../lib/VideoConfManager';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups';
import { useVideoConfOpenCall } from '../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();
	const handleOpenCall = useVideoConfOpenCall();

	useEffect(
		() =>
			VideoConfManager.on('call/join', (props) => {
				handleOpenCall(props.url, props.providerName);
			}),
		[handleOpenCall],
	);

	useEffect(() => {
		VideoConfManager.on('direct/stopped', () => setOutgoing(undefined));
		VideoConfManager.on('calling/ended', () => setOutgoing(undefined));
	}, []);

	const contextValue = useMemo(
		() => ({
			manager: VideoConfManager,
			dispatchOutgoing: (option: Omit<VideoConfPopupPayload, 'id'>): void => setOutgoing({ ...option, id: option.rid }),
			dismissOutgoing: (): void => setOutgoing(undefined),
			startCall: (rid: IRoom['_id'], confTitle?: string): Promise<void> => VideoConfManager.startCall(rid, confTitle),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			dismissCall: (callId: string): void => {
				VideoConfManager.dismissIncomingCall(callId);
			},
			rejectIncomingCall: (callId: string): void => VideoConfManager.rejectIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			setPreferences: (prefs: Partial<(typeof VideoConfManager)['preferences']>): void => VideoConfManager.setPreferences(prefs),
			queryIncomingCalls: {
				getCurrentValue: (): DirectCallData[] => VideoConfManager.getIncomingDirectCalls(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('incoming/changed', cb),
			},
			queryRinging: {
				getCurrentValue: (): boolean => VideoConfManager.isRinging(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('ringing/changed', cb),
			},
			queryCalling: {
				getCurrentValue: (): boolean => VideoConfManager.isCalling(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('calling/changed', cb),
			},
			queryCapabilities: {
				getCurrentValue: (): ProviderCapabilities => VideoConfManager.capabilities,
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('capabilities/changed', cb),
			},
			queryPreferences: {
				getCurrentValue: (): CallPreferences => VideoConfManager.preferences,
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('preference/changed', cb),
			},
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
