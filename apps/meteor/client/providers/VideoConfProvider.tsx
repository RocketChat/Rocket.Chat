import { IRoom } from '@rocket.chat/core-typings';
import React, { ReactElement, useState, ReactNode, useMemo } from 'react';
import { Unsubscribe } from 'use-subscription';

import { VideoConfContext, VideoConfPopupPayload } from '../contexts/VideoConfContext';
import { VideoConfManager, DirectCallParams } from '../lib/VideoConfManager';
import VideoConfPopups from '../views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [outgoing, setOutgoing] = useState<VideoConfPopupPayload | undefined>();

	const contextValue = useMemo(
		() => ({
			dispatchOutgoing: (option: Omit<VideoConfPopupPayload, 'id'>): void => setOutgoing({ ...option, id: option.rid }),
			dismissOutgoing: (): void => setOutgoing(undefined),
			startCall: (rid: IRoom['_id']): Promise<void> => VideoConfManager.startCall(rid),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			dismissCall: (callId: string): void => {
				VideoConfManager.dismissIncomingCall(callId);
			},
			rejectIncomingCall: (callId: string): void => VideoConfManager.rejectIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			setPreferences: (prefs: Partial<typeof VideoConfManager['preferences']>): void => VideoConfManager.setPreferences(prefs),
			changePreference: (key: 'cam' | 'mic', value: boolean): void => VideoConfManager.changePreference(key, value),
			queryIncomingCalls: {
				getCurrentValue: (): DirectCallParams[] => VideoConfManager.getIncomingDirectCalls(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('incoming/changed', cb),
			},
			queryRinging: {
				getCurrentValue: (): boolean => VideoConfManager.isRinging(),
				subscribe: (cb: () => void): Unsubscribe => VideoConfManager.on('ringing/changed', cb),
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
