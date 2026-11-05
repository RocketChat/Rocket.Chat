import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

/**
 * The rooms the user archived out of the sidebar. An archived room stays archived until the user unarchives
 * it: opening it, a new message or a mention do not bring it back, and it carries no badge meanwhile.
 *
 * Kept in `localStorage`, per user, as a list of room ids, so the behaviour can be tried before the state is
 * moved to the subscription (where the final implementation keeps it).
 */
export const useArchivedRooms = () => {
	const userId = useUserId();
	const [archivedRoomIdList, setArchivedRoomIdList] = useLocalStorage<string[]>(`sidebarArchivedRooms-${userId ?? 'anonymous'}`, []);

	const archivedRoomIds = useMemo(() => new Set(archivedRoomIdList), [archivedRoomIdList]);

	const isArchivedRoom = useCallback((rid: string): boolean => archivedRoomIds.has(rid), [archivedRoomIds]);

	const archiveRooms = useCallback(
		(rids: string[]) => setArchivedRoomIdList((current) => [...new Set([...current, ...rids])]),
		[setArchivedRoomIdList],
	);

	const unarchiveRoom = useCallback(
		(rid: string) => setArchivedRoomIdList((current) => current.filter((id) => id !== rid)),
		[setArchivedRoomIdList],
	);

	return { archivedRoomIds, isArchivedRoom, archiveRooms, unarchiveRoom };
};
