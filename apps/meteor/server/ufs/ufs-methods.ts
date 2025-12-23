import type { Readable } from 'stream';

import type { IUpload } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { UploadFS } from './ufs';

export async function ufsComplete(
	fileId: string,
	storeName: string,
	fileStream: Readable,
	options?: { session?: ClientSession },
): Promise<IUpload> {
	check(fileId, String);
	check(storeName, String);

	// Get store
	const store = UploadFS.getStore(storeName);
	if (!store) {
		throw new Meteor.Error('invalid-store', 'Store not found');
	}

	return new Promise(async (resolve, reject) => {
		try {
			// todo check if temp file exists

			// Get file
			const file = await store.getCollection().findOne<IUpload>({ _id: fileId }, { session: options?.session });

			if (!file) {
				throw new Meteor.Error('invalid-file', 'File is not valid');
			}

			const validateOptions = { session: options?.session, stream: fileStream };

			// if (fileStream instanceof fs.ReadStream) {
			// 	delete validateOptions.stream;
			// }

			// validate might pipe the stream - when it happens, it modifies the reference in the validateOptions object
			let { stream } = (await store.validate(file, validateOptions)) || {};
			// let stream;

			console.log('UFS COMPLETE AFTER VALIDATE', { $: { stream, fileStream } });

			// if (fileStream instanceof fs.ReadStream) {
			// 	// rewind the stream
			// 	fileStream.close();
			// 	stream = fs.createReadStream(fileStream.path);
			// }

			if (!stream) {
				stream = fileStream;
			}

			console.log('UFS COMPLETE AFTER VALIDATE', { $: { stream, fileStream } });

			// Clean upload if error occurs
			stream.once('error', (err) => {
				console.error(err);
				void store.removeById(fileId, { session: options?.session });
				reject(err);
			});

			// Save file in the store
			await store.write(
				stream,
				fileId,
				(err, file) => {
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
