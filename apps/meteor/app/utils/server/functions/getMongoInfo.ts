import { MongoInternals } from 'meteor/mongo';

function getOplogInfo(): { mongo: MongoConnection } {
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

	return { mongo };
}

async function fallbackMongoInfo(): Promise<{
	mongoVersion: string;
	mongoStorageEngine?: string;
	mongo: MongoConnection;
}> {
	let mongoVersion;
	let mongoStorageEngine;

	const { mongo } = getOplogInfo();

	try {
		const { version } = await mongo.db.command({ buildinfo: 1 });
		mongoVersion = version;
		mongoStorageEngine = 'unknown';
	} catch (e) {
		console.error('=== Error getting MongoDB info ===');
		console.error(e?.toString());
		console.error('----------------------------------');
		console.error("Without mongodb version we can't ensure you are running a compatible version.");
		console.error('If you are running your mongodb with auth enabled and an user different from admin');
		console.error('you may need to grant permissions for this user to check cluster data.');
		console.error('You can do it via mongo shell running the following command replacing');
		console.error("the string YOUR_USER by the correct user's name:");
		console.error('');
		console.error('   db.runCommand({ grantRolesToUser: "YOUR_USER" , roles: [{role: "clusterMonitor", db: "admin"}]})');
		console.error('');
		console.error('==================================');
	}

	return { mongoVersion, mongoStorageEngine, mongo };
}

export async function getMongoInfo(): Promise<{
	mongoVersion: string;
	mongoStorageEngine?: string;
	mongo: MongoConnection;
}> {
	let mongoVersion;
	let mongoStorageEngine;

	const { mongo } = getOplogInfo();

	try {
		const { version, storageEngine } = await mongo.db.command({ serverStatus: 1 });

		mongoVersion = version;
		mongoStorageEngine = storageEngine.name;
	} catch (e) {
		return fallbackMongoInfo();
	}

	return { mongoVersion, mongoStorageEngine, mongo };
}
