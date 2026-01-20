import { useEffect } from 'react';

import { useMediaCallExternalContext } from '../context/MediaCallContext';

export const useMediaCallOpenRoomTracker = (openRoomId?: string) => {
	const { setOpenRoomId } = useMediaCallExternalContext();

	useEffect(() => {
		if (!setOpenRoomId) {
			return;
		}
		setOpenRoomId(openRoomId);
		return () => {
			setOpenRoomId(undefined);
		};
	}, [setOpenRoomId, openRoomId]);
};
