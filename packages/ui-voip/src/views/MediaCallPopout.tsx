import { useCallback, useEffect, useLayoutEffect } from 'react';

import { useMediaCallInstance, usePeekMediaSessionState, usePeekMediaSessionCallId } from '../context';
import MediaCallPopoutWindow from './MediaCallPopoutWindow';
import { usePopoutWindow } from './usePopoutWindow';
import { useSetPopoutWindow } from '../providers/useMediaSessionInstance';

const MediaCallPopout = () => {
	const { currentViews, unregisterView } = useMediaCallInstance();
	const callState = usePeekMediaSessionState();
	const callId = usePeekMediaSessionCallId();

	const onClosePopout = useCallback(() => {
		unregisterView('popout');
	}, [unregisterView]);

	const { container, closePopoutWindow, openPopoutWindow } = usePopoutWindow(onClosePopout);

	useSetPopoutWindow(container?.ownerDocument.defaultView || undefined);

	const onClosePopoutAndWindow = useCallback(() => {
		onClosePopout();
		closePopoutWindow();
	}, [onClosePopout, closePopoutWindow]);

	useLayoutEffect(() => {
		if (callState !== 'ongoing') {
			onClosePopout();
		}
	}, [callState, onClosePopout]);

	useEffect(() => {
		queueMicrotask(() => {
			if (currentViews.includes('popout') && callId) {
				void openPopoutWindow(callId);
				return;
			}
			closePopoutWindow();
		});
	}, [currentViews, openPopoutWindow, closePopoutWindow, callId]);

	if (!container) {
		return null;
	}

	return <MediaCallPopoutWindow container={container} onClosePopout={onClosePopoutAndWindow} />;
};

export default MediaCallPopout;
