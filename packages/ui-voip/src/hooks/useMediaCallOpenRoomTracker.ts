import { useEffect } from 'react';

import { useMediaCallInstanceContext } from '../context/MediaCallInstanceContext';

export const useMediaCallOpenRoomTracker = (openRoomId?: string) => {
	const { setOpenRoomId } = useMediaCallInstanceContext();

	useEffect(() => {
		setOpenRoomId(openRoomId);
		return () => {
			setOpenRoomId(undefined);
		};
	}, [setOpenRoomId, openRoomId]);
};
