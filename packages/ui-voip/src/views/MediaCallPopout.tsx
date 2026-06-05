import { useCallback, useEffect, useLayoutEffect } from 'react';

import { useMediaCallInstance, useMediaCallView } from '../context';
import MediaCallPopoutWindow from './MediaCallPopoutWindow';
import { usePopoutWindow } from './usePopoutWindow';

const MediaCallPopout = () => {
	const { currentViews } = useMediaCallInstance();
	const { sessionState, onClosePopout } = useMediaCallView();
	const { container, closePopoutWindow, openPopoutWindow } = usePopoutWindow(onClosePopout);

	const onClosePopoutAndWindow = useCallback(() => {
		onClosePopout();
		closePopoutWindow();
	}, [onClosePopout, closePopoutWindow]);

	useLayoutEffect(() => {
		if (sessionState.state !== 'ongoing') {
			onClosePopout();
		}
	}, [sessionState.state, onClosePopout]);

	useEffect(() => {
		if (currentViews.includes('popout')) {
			// TODO: Fix this title
			void openPopoutWindow('Call with Peer X');
			return;
		}
		closePopoutWindow();
	}, [currentViews, openPopoutWindow, closePopoutWindow]);

	if (!container) {
		return null;
	}

	return <MediaCallPopoutWindow container={container} onClosePopout={onClosePopoutAndWindow} />;
};

export default MediaCallPopout;
