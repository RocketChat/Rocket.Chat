import { useEffect } from 'react';

import { useMediaCallInstance } from '../context/MediaCallInstanceContext';

export const useMediaCallOpenRoomTracker = (openRoomId?: string) => {
	const { setOpenRoomId } = useMediaCallInstance();

	useEffect(() => {
		setOpenRoomId(openRoomId);
		return () => {
			setOpenRoomId(undefined);
		};
	}, [setOpenRoomId, openRoomId]);
};
