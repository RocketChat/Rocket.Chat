import type { IRoom, IUser, IUpload } from '@rocket.chat/core-typings';
import { useSetting, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { getDifference, MINUTES } from '../lib/getDifference';

export const useMessageDeletionIsAllowed = (rid: IRoom['_id'], file: IUpload, uid: IUser['_id'] | null) => {
	const canForceDelete = usePermission('force-delete-message', rid);
	const deletionIsEnabled = useSetting('Message_AllowDeleting');
	const userHasPermissionToDeleteAny = usePermission('delete-message', rid);
	const userHasPermissionToDeleteOwn = usePermission('delete-own-message');
	const bypassBlockTimeLimit = usePermission('bypass-time-limit-edit-and-delete');
	const blockDeleteInMinutes = useSetting<number>('Message_AllowDeleting_BlockDeleteInMinutes');

	const isDeletionAllowed = useMemo(() => {
		if (canForceDelete) {
			return true;
		}

		if (!deletionIsEnabled) {
			return false;
		}

		if (!userHasPermissionToDeleteAny && !userHasPermissionToDeleteOwn) {
			return false;
		}

		const checkTimeframe = (file: IUpload) => {
			if (!bypassBlockTimeLimit && blockDeleteInMinutes !== 0) {
				if (!file.uploadedAt || !blockDeleteInMinutes) {
					return false;
				}

				const currentTsDiff = getDifference(new Date(), new Date(file.uploadedAt), MINUTES);
				return currentTsDiff < blockDeleteInMinutes;
			}

			return true;
		};

		const isUserOwnFile = (file: IUpload) => file.userId === uid;

		if (userHasPermissionToDeleteAny || isUserOwnFile(file)) {
			return checkTimeframe(file);
		}

		return false;
	}, [
		canForceDelete,
		deletionIsEnabled,
		userHasPermissionToDeleteAny,
		userHasPermissionToDeleteOwn,
		blockDeleteInMinutes,
		bypassBlockTimeLimit,
		file,
		uid,
	]);

	return isDeletionAllowed;
};
