import { useSetting, usePermission } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { getDifference, MINUTES } from '../lib/getDifference';

export const useMessageDeletionIsAllowed = (rid, uid) => {
	const canForceDelete = usePermission('force-delete-message', rid);
	const deletionIsEnabled = useSetting('Message_AllowDeleting');
	const userHasPermissonToDeleteAny = usePermission('delete-message', rid);
	const userHasPermissonToDeleteOwn = usePermission('delete-own-message');
	const blockDeleteInMinutes = useSetting('Message_AllowDeleting_BlockDeleteInMinutes');

	const isDeletionAllowed = (() => {
		if (canForceDelete) {
			return () => true;
		}

		if (!deletionIsEnabled) {
			return () => false;
		}

		if (!userHasPermissonToDeleteAny && !userHasPermissonToDeleteOwn) {
			return () => false;
		}

		const checkTimeframe =
			blockDeleteInMinutes !== 0
				? ({ ts }) => {
						if (!ts) {
							return false;
						}

						const currentTsDiff = getDifference(new Date(), new Date(ts), MINUTES);

						return currentTsDiff < blockDeleteInMinutes;
				  }
				: () => true;

		if (userHasPermissonToDeleteAny) {
			return checkTimeframe;
		}

		const isOwn = ({ uid: owner }) => owner === uid;

		return (msg) => isOwn(msg) && checkTimeframe(msg);
	})();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useCallback(isDeletionAllowed, [
		canForceDelete,
		deletionIsEnabled,
		userHasPermissonToDeleteAny,
		userHasPermissonToDeleteOwn,
		blockDeleteInMinutes,
	]);
};
