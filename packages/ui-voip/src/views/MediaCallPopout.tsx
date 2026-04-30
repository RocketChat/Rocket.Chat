import { useLayoutEffect } from 'react';

import { useMediaCallInstance, useMediaCallView } from '../context';
import MediaCallPopoutWindow from './MediaCallPopoutWindow';
import type { AvailableViews } from '../context/MediaCallInstanceContext';

const MediaCallPopout = () => {
	const { currentViews, setCurrentViews } = useMediaCallInstance();
	const { sessionState } = useMediaCallView();

	useLayoutEffect(() => {
		setCurrentViews((prev) => {
			if (sessionState.state !== 'ongoing' && prev.has('popout')) {
				prev.delete('popout');
				return new Set<AvailableViews>(prev);
			}
			return prev;
		});
	}, [sessionState.state, setCurrentViews]);

	if (!currentViews.has('popout')) {
		return null;
	}

	return <MediaCallPopoutWindow />;
};

export default MediaCallPopout;
