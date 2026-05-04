import { useLayoutEffect } from 'react';

import { useMediaCallInstance, useMediaCallView } from '../context';
import MediaCallPopoutWindow from './MediaCallPopoutWindow';

const MediaCallPopout = () => {
	const { currentViews } = useMediaCallInstance();
	const { sessionState, onClosePopout } = useMediaCallView();

	useLayoutEffect(() => {
		if (sessionState.state !== 'ongoing') {
			onClosePopout();
		}
	}, [sessionState.state, onClosePopout]);

	if (!currentViews.has('popout')) {
		return null;
	}

	return <MediaCallPopoutWindow />;
};

export default MediaCallPopout;
