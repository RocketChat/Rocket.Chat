import { MongoInternals } from 'meteor/mongo';
import { AppSourceStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { GridFSBucket } from 'mongodb';

export class AppFileSystemSourceStorage extends AppSourceStorage {
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
		await fs.writeFile(`${ tempPath + item.id }.zip`, zip);

		return true;
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		this.bucket.openDownloadStream()
	}

	public async update(id: string, zip: Buffer): Promise<boolean> {
		await fs.writeFile(`${ tempPath + id }.zip`, zip);
		return true;
	}

	public async remove(item: IAppStorageItem): Promise<boolean> {
		fs.unlink(`${ tempPath + item.id }.zip`);
		return true;
	}
}
