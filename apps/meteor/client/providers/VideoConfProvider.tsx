import { VideoConfPopupBackdrop } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ReactNode } from 'react';

import { VideoConfContext } from '../contexts/VideoConfContext';
import VideoConfPortal from '../portals/VideoConfPortal';
// import { dispatchToastMessage, subscribeToToastMessages } from '../lib/toast';
// import { handleError } from '../lib/utils/handleError';

const VideoConfContextProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	const contextValue = {
		dispatch: setCurrentModal,
	};

	return (
		<VideoConfContext.Provider value={contextValue}>
			{children}
			{currentModal && (
				<VideoConfPortal>
					<VideoConfPopupBackdrop>{currentModal}</VideoConfPopupBackdrop>
				</VideoConfPortal>
			)}
		</VideoConfContext.Provider>
	);
};

export default VideoConfContextProvider;
