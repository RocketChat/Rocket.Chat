import { useEffect, useState } from 'react';

import { listRooms, type RoomItem } from './api';
import type { Session } from './session';

export function useRooms(session: Session) {
	const [rooms, setRooms] = useState<RoomItem[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		listRooms(session).then(setRooms, (e) => setError(String(e)));
	}, [session]);

	return { rooms, error };
}
