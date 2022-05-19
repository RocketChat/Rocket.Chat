import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ReactNode } from 'react';

import { VideoConfPopupContext, VideoConfPopupPayload } from '../contexts/VideoConfPopupContext';
import VideoConfPopupPortal from '../portals/VideoConfPopupPortal';
import VideoConfPopup from '../views/room/contextualBar/VideoConference/VideoConfPopup';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [popUps, setPopUps] = useState<VideoConfPopupPayload[]>([]);

	const contextValue = {
		dispatch: (option: Omit<VideoConfPopupPayload, 'id'>): void => setPopUps((popUps) => [...popUps, { id: option.room._id, ...option }]),
		dismiss: (rid: VideoConfPopupPayload['room']['_id']): void => setPopUps((prevState) => prevState.filter((popUp) => popUp.id !== rid)),
	};

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
