import type { IUser } from '@rocket.chat/core-typings';
import { Avatars } from '@rocket.chat/models';

import { FileUpload } from '../../../../../../server/lib/media/file-upload';
import type { ExchangeContactPhoto } from '../../definition/types';
import { forEachWithConcurrency } from '../forEachWithConcurrency';
import { AVATAR_DELETE_CONCURRENCY } from '../limits';

const store = () => FileUpload.getStore('Avatars');

export const saveContactAvatar = async (
	ownerId: IUser['_id'],
	folderId: string,
	{ data, contentType, externalId }: ExchangeContactPhoto,
): Promise<void> => {
	const current = await Avatars.findOneContactAvatar(ownerId, folderId, externalId, { projection: { _id: 1 } });

	if (current) {
		await store().deleteById(current._id);
	}

	await store().insert({ userId: ownerId, folderId, externalId, type: contentType, size: data.byteLength }, Buffer.from(data));
};

export const deleteContactAvatars = async (
	ownerId: IUser['_id'],
	folderId: string,
	externalIds?: { in: string[] } | { notIn: string[] },
): Promise<void> => {
	// Concurrent because on  every backend but the local ones that is a network round trip.
	await forEachWithConcurrency(
		Avatars.findContactAvatars(ownerId, folderId, externalIds, { projection: { _id: 1, store: 1 } }),
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
