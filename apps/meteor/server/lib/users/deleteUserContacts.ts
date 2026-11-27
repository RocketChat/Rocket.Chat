import type { IUser } from '@rocket.chat/core-typings';
import { AVATAR_DELETE_CONCURRENCY, forEachWithConcurrency, logger, scrubForLog } from '@rocket.chat/exchange';
import { Avatars, Contacts, ExchangeContactSyncState } from '@rocket.chat/models';

import { FileUpload } from '../media/file-upload';

const deleteContactAvatars = async (uid: IUser['_id']): Promise<void> => {
	await forEachWithConcurrency(
		Avatars.findContactAvatarsByUserId(uid, { projection: { _id: 1, store: 1 } }),
		AVATAR_DELETE_CONCURRENCY,
		async ({ _id, store: storeName }) => {
			if (!storeName) {
				return;
			}

			try {
				await FileUpload.getStoreByName(storeName).delete(_id);
			} catch (err) {
				logger.warn({ msg: 'Could not delete a contact avatar of a deleted user', uid, avatarId: _id, err: scrubForLog(err) });
			}
		},
	);
};

export const deleteUserContacts = async (uid: IUser['_id']): Promise<void> => {
	await Contacts.deleteByUserId(uid);
	await ExchangeContactSyncState.deleteByUserId(uid);
	await deleteContactAvatars(uid);
};
