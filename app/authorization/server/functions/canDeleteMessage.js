import { hasPermissionAsync } from './hasPermission';
import { getValue } from '../../../settings/server/raw';

const diff = (ts) => {
	const dif = Date.now() - ts;
	return Math.round((dif / 1000) / 60);
};

const notAllowed = () => {
	throw new Error('error-action-not-allowed');
};

export const canDeleteMessageAsync = async (uid, { u, rid, ts }) => {
	const forceDelete = await hasPermissionAsync(uid, 'force-delete-message', rid);

	if (forceDelete) {
		return true;
	}
	const deleteAllowed = await getValue('Message_AllowDeleting');

	if (!deleteAllowed) {
		return notAllowed();
	}

	const allowedToDeleteAny = await hasPermissionAsync(uid, 'delete-message', rid);

	const allowed = allowedToDeleteAny || (uid === u._id && await hasPermissionAsync(uid, 'delete-own-message'));
	if (!allowed) {
		return notAllowed();
	}
	const blockDeleteInMinutes = await getValue('Message_AllowDeleting_BlockDeleteInMinutes');

	if (!blockDeleteInMinutes) {
		return true;
	}

	if (ts == null) {
		return notAllowed();
	}

	const currentTsDiff = diff(ts);
	if (currentTsDiff > blockDeleteInMinutes) {
		throw new Error('error-message-deleting-blocked', 'Message deleting is blocked', {
			method: 'deleteMessage',
		});
	}
};

export const canDeleteMessage = (uid, { u, rid, ts }) => Promise.await(canDeleteMessageAsync(uid, { u, rid, ts }));
