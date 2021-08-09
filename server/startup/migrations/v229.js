import { Migrations } from '../../../app/migrations';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import { MongoInternals } from 'meteor/mongo';


Migrations.add({
	version: 229,
	up () {
		console.log('Migrating apps to GridFS');

		const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
		const appsCollection = db.collection('rocketchat_apps');

		const bucket = new GridFSBucket(db, {
			bucketName: 'rocketchat_apps_packages',
			chunkSizeBytes: 1024 * 255,
		});

		const apps = Promise.await(appsCollection.find({}).toArray());

		for (const app of apps) {
			console.log(`Migrating app ${app.info.name}@${app.info.version}'s source to GridFS`);
			const packageName = `${ app.info.nameSlug }-${ app.info.version }.package`;
			const fileId = Promise.await(createGridFSFileFromSource(packageName, Buffer.from(app.zip, 'base64'), bucket));
			Promise.await(updateAppSourcePath(appsCollection, app._id, fileId));
		}
	}
});

async function createGridFSFileFromSource(packageName, appSource, bucket) {
	try {
		const bucketWriteStream = Readable.from([appSource]).pipe(bucket.openUploadStream(packageName));
		const fileId = await promisedEvent(bucketWriteStream);
		console.log(`${packageName} has been written to GridFS as ${fileId}`);
		return fileId;
	} catch (error) {
		console.error(`Could not migrate ${packageName}'s source to GridFS. Reason: ${error.message}`)
		throw error;
	}
}

async function updateAppSourcePath(collection, appId, fileId) {
		try {
			const { nModified } = collection.updateOne({ _id: appId }, {
				$set: {
					sourcePath: `GridFS:/${fileId}`
				},
				$unset: {
					compiled: 1,
					zip: 1
				}
			});

			if (nModified < 1) {
				console.error(`Could not update the app ${appId}'s sourcePath. Reason: document couldn't be updated`);
			}

			return;
		} catch (error) {
			console.error(`Could not update the app ${appId}'s sourcePath. Reason: ${error.message}`)
			throw error;
		}
}

async function promisedEvent(listener) {
	return new Promise((resolve, reject) => {
		listener.on('error', (err) => reject(err));
		listener.on('finish', () => resolve(listener.id));
	});
}
