import { IRoom } from '@rocket.chat/core-typings';
import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ReactNode, useMemo } from 'react';

import { VideoConfPopupContext, VideoConfIncomingCall, VideoConfPopupPayload } from '../contexts/VideoConfPopupContext';
import { VideoConfManager, useVideoConfIncomingCalls } from '../lib/VideoConfManager';
import VideoConfPopupPortal from '../portals/VideoConfPopupPortal';
import VideoConfPopup from '../views/room/contextualBar/VideoConference/VideoConfPopup';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [popUps, setPopUps] = useState<VideoConfPopupPayload[]>([]);

	const contextValue = useMemo(
		() => ({
			dispatch: (option: Omit<VideoConfPopupPayload, 'id'>): void => setPopUps((popUps) => [...popUps, { id: option.room._id, ...option }]),
			dismiss: (rid: VideoConfPopupPayload['room']['_id']): void => setPopUps((prevState) => prevState.filter((popUp) => popUp.id !== rid)),
			startCall: (rid: IRoom['_id']): Promise<void> => VideoConfManager.startCall(rid),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			muteCall: (callId: string): void => VideoConfManager.muteIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			useIncomingCalls: (): VideoConfIncomingCall[] => useVideoConfIncomingCalls(),
		}),
		[],
	);

	return (
		<VideoConfPopupContext.Provider value={contextValue}>
			{children}
			{popUps?.length > 0 && (
				<VideoConfPopupPortal>
					<VideoConfPopupBackdrop>
						{popUps.map(({ id, room }, index) => (
							<VideoConfPopup key={id} id={id} room={room} position={(index + 1) * 10} current={index} total={popUps.length} />
						))}
					</VideoConfPopupBackdrop>
				</VideoConfPopupPortal>
			)}
		</VideoConfPopupContext.Provider>
	);
};

export default VideoConfContextProvider;
