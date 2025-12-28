import type { IUpload } from '@rocket.chat/core-typings';
import { MongoInternals } from 'meteor/mongo';
import { NpmModuleMongodb } from 'meteor/npm-mongo';
import type { ObjectId } from 'mongodb';

import { UploadFS } from './ufs';
import type { StoreOptions } from './ufs-store';

type GridFSStoreOptions = StoreOptions & {
	chunkSize: number;
	collectionName: string;
};

export class GridFSStore extends UploadFS.Store {
	protected chunkSize: number;

	protected collectionName: string;

	constructor(options: GridFSStoreOptions) {
		// Default options
		options = Object.assign(
			{
				chunkSize: 1024 * 255,
				collectionName: 'uploadfs',
			},
			options,
		);

		// Check options
		if (typeof options.chunkSize !== 'number') {
			throw new TypeError('GridFSStore: chunkSize is not a number');
		}
		if (typeof options.collectionName !== 'string') {
			throw new TypeError('GridFSStore: collectionName is not a string');
		}

		super(options);

		this.chunkSize = options.chunkSize;
		this.collectionName = options.collectionName;

		// const mongo = MongoInternals.NpmModule;
		const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
		const mongoStore = new NpmModuleMongodb.GridFSBucket(db as any, {
			bucketName: options.collectionName,
			chunkSizeBytes: this.chunkSize,
		});

		this.delete = async function (fileId) {
			const collectionName = `${options.collectionName}.files`;
			const file = await db.collection(collectionName).findOne({ _id: fileId as any });

			if (file) {
				await mongoStore.delete(fileId as unknown as ObjectId);
			}
		};

		this.getReadStream = async function (fileId: string, _file: IUpload, options?: { end?: number }) {
			options = Object.assign({}, options);
			// https://mongodb.github.io/node-mongodb-native/4.4/interfaces/GridFSBucketReadStreamOptionsWithRevision.html#end
			// according to the mongodb doc, the end is 0-based offset in bytes to stop streaming before -<< BEFORE
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
			// <range-end> an integer in the given unit indicating the end position (zero-indexed & inclusive) of the requested range. -<< inclusive
			// so before there always one byte miss, then browser will send a start=end request, with case fail to get the DB's last byte
			// this will leads to audio's duration Infinite and keep waiting...
			if (options?.end) {
				options.end += 1;
			}
			return mongoStore.openDownloadStream(fileId as unknown as ObjectId, options);
		};

		this.getWriteStream = async function (fileId: string, file: IUpload, _options?: any) {
			const writeStream = mongoStore.openUploadStreamWithId(fileId as unknown as ObjectId, fileId, {
				chunkSizeBytes: this.chunkSize,
				contentType: file.type,
			});
			let finished = false;
			writeStream.on('finish', () => {
				finished = true;
			});
			writeStream.on('close', () => {
				if (!finished) {
					writeStream.emit('finish');
				}
			});
			return writeStream;
		};
	}
}

// Add store to UFS namespace
UploadFS.store.GridFS = GridFSStore;
