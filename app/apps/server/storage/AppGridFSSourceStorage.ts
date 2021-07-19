import { MongoInternals } from 'meteor/mongo';
import { GridFSBucket, ObjectId } from 'mongodb';
import { AppSourceStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { streamToBuffer } from '../../../file-upload/server/lib/streamToBuffer';

export class AppGridFSSourceStorage extends AppSourceStorage {
	private bucket: GridFSBucket;

	constructor() {
		super();

		const { GridFSBucket } = MongoInternals.NpmModules.mongodb.module;
		const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

		this.bucket = new GridFSBucket(db, {
			bucketName: 'rocketchat_apps_packages',
			chunkSizeBytes: 1024 * 255,
		});
	}

	public async store(item: IAppStorageItem, zip: Buffer): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const fileId = this.itemToId(item);
			const writeStream = this.bucket.openUploadStreamWithId(fileId, fileId.toHexString())
				.on('close', () => resolve(true))
				.on('error', reject);

			writeStream.write(zip);
			writeStream.end();
		});
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		return streamToBuffer(this.bucket.openDownloadStream(this.itemToId(item)));
	}

	public async update(item: IAppStorageItem, zip: Buffer): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const fileId = this.itemToId(item);
			const writeStream = this.bucket.openUploadStreamWithId(fileId, fileId.toHexString())
				.on('close', () => resolve(true))
				.on('error', reject);

			writeStream.write(zip);
			writeStream.end();
		});
	}

	public async remove(item: IAppStorageItem): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.bucket.delete(this.itemToId(item), (error) => {
				if (error) {
					// Ignoring the error reason for now
					console.error(error);
					return resolve(false);
				}

				resolve(true);
			});
		});
	}

	private itemToId(item: IAppStorageItem): ObjectId {
		return item.id as unknown as ObjectId;
	}
}
