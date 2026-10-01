import type { IContact, IUser } from '@rocket.chat/core-typings';
import { Avatars, Contacts } from '@rocket.chat/models';

import { FileUpload } from '../../../../../../server/lib/media/file-upload';
import type { ExchangeContactPhoto } from '../../definition/types';
import { forEachWithConcurrency } from '../forEachWithConcurrency';
import { AVATAR_DELETE_CONCURRENCY } from '../limits';

const store = () => FileUpload.getStore('Avatars');

export const saveContactAvatar = async (
	ownerId: IUser['_id'],
	contactId: IContact['_id'],
	{ data, contentType }: ExchangeContactPhoto,
): Promise<void> => {
	const current = await Avatars.findOneContactAvatar(contactId, { projection: { _id: 1 } });

	if (current) {
		await store().deleteById(current._id);
	}

	await store().insert({ userId: ownerId, contactId, type: contentType, size: data.byteLength }, Buffer.from(data));
};

export const deleteContactAvatars = async (contactIds: IContact['_id'][]): Promise<void> => {
	if (!contactIds.length) {
		return;
	}

	// Concurrent because on  every backend but the local ones that is a network round trip.
	await forEachWithConcurrency(
		Avatars.findContactAvatars(contactIds, { projection: { _id: 1, store: 1 } }),
		AVATAR_DELETE_CONCURRENCY,
		async ({ _id, store: storeName }) => {
			if (!storeName) {
				return;
			}

			// The record is already in hand, so this skips the read `deleteById` would repeat.
			await FileUpload.getStoreByName(storeName).delete(_id);
		},
	);
};

export const deleteFolderContactAvatars = async (
	uid: IUser['_id'],
	folderId: string,
	externalIds?: { in: string[] } | { notIn: string[] },
): Promise<void> => {
	const contactIds: string[] = [];

	for await (const { _id } of Contacts.findImportedByFolder<Pick<IContact, '_id'>>(uid, folderId, externalIds, {
		projection: { _id: 1 },
	})) {
		contactIds.push(_id);
	}

	await deleteContactAvatars(contactIds);
};
