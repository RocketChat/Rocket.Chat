import { IRoom } from '@rocket.chat/core-typings';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ReactNode, useEffect, useMemo } from 'react';

import { VideoConfPopupContext, VideoConfIncomingCall, VideoConfPopupPayload } from '../contexts/VideoConfPopupContext';
import { VideoConfManager, useVideoConfIncomingCalls, useIsRinging } from '../lib/VideoConfManager';
import VideoConfPopupPortal from '../portals/VideoConfPopupPortal';
import VideoConfPopup from '../views/room/contextualBar/VideoConference/VideoConfPopup';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [popUps, setPopUps] = useState<VideoConfPopupPayload[]>([]);
	const incomingCalls = useVideoConfIncomingCalls();
	const customSound = useCustomSound();
	const isRinging = useIsRinging();

	const contextValue = useMemo(
		() => ({
			dispatch: (option: Omit<VideoConfPopupPayload, 'id'> & { id?: string }): void =>
				setPopUps((popUps) => [...popUps, { ...(option.id ? { id: option.id } : { id: option.rid }), ...option }]),
			dismiss: (id: VideoConfPopupPayload['id']): void => setPopUps((prevState) => prevState.filter((popUp) => popUp.id !== id)),
			startCall: (rid: IRoom['_id']): Promise<void> => VideoConfManager.startCall(rid),
			acceptCall: (callId: string): void => VideoConfManager.acceptIncomingCall(callId),
			joinCall: (callId: string): Promise<void> => VideoConfManager.joinCall(callId),
			muteCall: (): void => VideoConfManager.muteIncomingCalls(),
			rejectIncomingCall: (callId: string): void => VideoConfManager.rejectIncomingCall(callId),
			abortCall: (): void => VideoConfManager.abortCall(),
			useIncomingCalls: (): VideoConfIncomingCall[] => useVideoConfIncomingCalls(),
			setPreferences: (prefs: Partial<typeof VideoConfManager['preferences']>): void => VideoConfManager.setPreferences(prefs),
			changePreference: (key: 'cam' | 'mic', value: boolean): void => VideoConfManager.changePreference(key, value),
			useIsRinging: (): boolean => useIsRinging(),
		}),
		[],
	);

	useEffect(() => {
		if (incomingCalls.length) {
			incomingCalls.map((incomingCall) => contextValue.dispatch({ id: incomingCall.callId, rid: incomingCall.rid, isReceiving: true }));

			if (isRinging) {
				customSound.play('calling');
				const soundInterval = setInterval(() => {
					customSound.play('calling');
				}, 3000);

				return (): void => {
					customSound.pause('calling');
					clearInterval(soundInterval);
				};
			}
		}

		return setPopUps([]);
	}, [incomingCalls, contextValue, customSound, isRinging]);

	return (
		<VideoConfPopupContext.Provider value={contextValue}>
			{children}
			{popUps?.length > 0 && (
				<VideoConfPopupPortal>
					<VideoConfPopupBackdrop>
						{popUps.map(({ id, rid, isReceiving }, index) => (
							<VideoConfPopup
								key={id}
								id={id}
								rid={rid}
								isReceiving={isReceiving}
								position={(index + 1) * 10}
								current={index}
								total={popUps.length}
							/>
						))}
					</VideoConfPopupBackdrop>
				</VideoConfPopupPortal>
			)}
		</VideoConfPopupContext.Provider>
	);
};

export default VideoConfContextProvider;
