import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useUserId, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { updateSubscription } from '../lib/mutationEffects/updateSubscription';

/** The archived rooms: the user's own `userArchived` flag on an open subscription. */
const archivedQuery = { open: { $ne: false }, userArchived: true };

/** How many rooms are changed at once; a long list goes in batches rather than as a burst of requests. */
const BATCH_SIZE = 5;

/**
 * The rooms the user archived out of the sidebar. An archived room stays archived until the user unarchives
 * it: opening it, a new message or a mention do not bring it back, and it carries no badge meanwhile.
 *
 * The flag lives on the subscription (`userArchived`, through `subscriptions.setUserArchived`), so it follows the
 * user across devices. The sidebar is updated ahead of the server and put back for the rooms it refuses.
 */
export const useArchivedRooms = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const dispatchToastMessage = useToastMessageDispatch();
	const setUserArchived = useEndpoint('POST', '/v1/subscriptions.setUserArchived');
	const archivedSubscriptions = useUserSubscriptions(archivedQuery);

	// Filtered again here: the query is the store's business, the flag is what counts.
	const archivedRoomIds = useMemo(
		() => new Set(archivedSubscriptions.filter((subscription) => subscription.userArchived).map((subscription) => subscription.rid)),
		[archivedSubscriptions],
	);

	const isArchivedRoom = useCallback((rid: string): boolean => archivedRoomIds.has(rid), [archivedRoomIds]);

	const setArchived = useStableCallback(async (rids: string[], archived: boolean) => {
		const change = async (rid: string) => {
			const previous = userId ? updateSubscription(rid, userId, { userArchived: archived }) : undefined;
			try {
				await setUserArchived({ roomId: rid, archived });
			} catch (error) {
				if (userId && previous) {
					updateSubscription(rid, userId, { userArchived: previous.userArchived });
				}
				throw error;
			}
		};

		let failed = 0;
		for (let start = 0; start < rids.length; start += BATCH_SIZE) {
			const outcomes = await Promise.allSettled(rids.slice(start, start + BATCH_SIZE).map(change));
			failed += outcomes.filter((outcome) => outcome.status === 'rejected').length;
		}

		if (failed) {
			dispatchToastMessage({ type: 'error', message: t(archived ? 'Rooms_not_archived' : 'Rooms_not_unarchived', { count: failed }) });
		}
	});

	const archiveRooms = useStableCallback((rids: string[]) => setArchived(rids, true));
	const unarchiveRoom = useStableCallback((rid: string) => setArchived([rid], false));

	return { archivedRoomIds, isArchivedRoom, archiveRooms, unarchiveRoom };
};
