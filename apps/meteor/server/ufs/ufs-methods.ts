import fs from 'fs';

import type { IUpload } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { UploadFS } from './ufs';

export async function ufsComplete(fileId: string, storeName: string, fileStream: fs.ReadStream, options?: { session?: ClientSession }): Promise<IUpload> {
	check(fileId, String);
	check(storeName, String);

	// Get store
	const store = UploadFS.getStore(storeName);
	if (!store) {
		throw new Meteor.Error('invalid-store', 'Store not found');
	}

	const removeTempFile = () =>
		fs.promises.unlink(fileStream.path).catch((err) =>
			console.error(`ufs: cannot delete temp file "${fileStream.path}" (${err.message})`)
		);

	return new Promise(async (resolve, reject) => {
		try {
			// todo check if temp file exists

			// Get file
			const file = await store.getCollection().findOne<IUpload>({ _id: fileId }, { session: options?.session });

			if (!file) {
				throw new Meteor.Error('invalid-file', 'File is not valid');
			}

			// Validate file before moving to the store
			await store.validate(file, { session: options?.session });

			// Clean upload if error occurs
			fileStream.on('error', (err) => {
				console.error(err);
				void store.removeById(fileId, { session: options?.session });
				reject(err);
			});

			// Save file in the store
			await store.write(
				fileStream,
				fileId,
				(err, file) => {
					removeTempFile();

					if (err) {
						return reject(err);
					}
					if (!file) {
						return reject(new Error('Unknown error writing file'));
					}
					resolve(file);
				},
				{ session: options?.session },
			);
		} catch (err: any) {
			// If write failed, remove the file
			await store.removeById(fileId, { session: options?.session });
			// removeTempFile(); // todo remove temp file on error or try again ?
			reject(new Meteor.Error('ufs: cannot upload file', err));
		}
	});
}
