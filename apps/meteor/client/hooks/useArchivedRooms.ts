import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

/**
 * PREVIEW ONLY. The rooms the user archived out of the sidebar, kept per user in this browser's `localStorage`
 * instead of the subscription, because the UI preview runs against a workspace whose server has no
 * `subscriptions.setUserArchived` yet. Same surface as the real hook, so nothing else differs from the feature
 * branch; this file is replaced by the feature's own once the test workspace has the server side.
 */
export const useArchivedRooms = () => {
	const userId = useUserId();
	const [archivedRoomIdList, setArchivedRoomIdList] = useLocalStorage<string[]>(`sidebarArchivedRooms-${userId ?? 'anonymous'}`, []);

	const archivedRoomIds = useMemo(() => new Set(archivedRoomIdList), [archivedRoomIdList]);

	const isArchivedRoom = useCallback((rid: string): boolean => archivedRoomIds.has(rid), [archivedRoomIds]);

	const archiveRooms = useCallback(
		async (rids: string[]): Promise<{ changed: number; failed: number }> => {
			setArchivedRoomIdList((current) => [...new Set([...current, ...rids])]);
			return { changed: rids.length, failed: 0 };
		},
		[setArchivedRoomIdList],
	);

	const unarchiveRoom = useCallback(
		async (rid: string): Promise<{ changed: number; failed: number }> => {
			setArchivedRoomIdList((current) => current.filter((id) => id !== rid));
			return { changed: 1, failed: 0 };
		},
		[setArchivedRoomIdList],
	);

	return { archivedRoomIds, isArchivedRoom, archiveRooms, unarchiveRoom };
};
