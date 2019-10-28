import { hasPermissionAsync } from './hasPermission';
import { getValue } from '../../../settings/server/raw';

const elapsedTime = (ts) => {
	const dif = Date.now() - ts;
	return Math.round((dif / 1000) / 60);
};

export const canDeleteMessageAsync = async (uid, { u, rid, ts }) => {
	const forceDelete = await hasPermissionAsync(uid, 'force-delete-message', rid);

	if (forceDelete) {
		return true;
	}

	if (!ts) {
		return false;
	}
	const deleteAllowed = await getValue('Message_AllowDeleting');

	if (!deleteAllowed) {
		return false;
	}

	const allowedToDeleteAny = await hasPermissionAsync(uid, 'delete-message', rid);

	const allowed = allowedToDeleteAny || (uid === u._id && await hasPermissionAsync(uid, 'delete-own-message'));
	if (!allowed) {
		return false;
	}
	const blockDeleteInMinutes = await getValue('Message_AllowDeleting_BlockDeleteInMinutes');

	if (!blockDeleteInMinutes) {
		return true;
	}

	const currentTsDiff = diff(ts);
	const timeElapsedForMessage = elapsedTime(ts);
	return timeElapsedForMessage <= blockDeleteInMinutes;
};

export const canDeleteMessage = (uid, { u, rid, ts }) => Promise.await(canDeleteMessageAsync(uid, { u, rid, ts }));
