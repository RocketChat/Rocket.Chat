import { Logger } from '@rocket.chat/logger';
import { MongoInternals } from 'meteor/mongo';

const logger = new Logger('Utils:GetMongoInfo');

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
		logger.error('=== Error getting MongoDB info ===');
		logger.error(e?.toString());
		logger.error('----------------------------------');
		logger.error("Without mongodb version we can't ensure you are running a compatible version.");
		logger.error('If you are running your mongodb with auth enabled and an user different from admin');
		logger.error('you may need to grant permissions for this user to check cluster data.');
		logger.error('You can do it via mongo shell running the following command replacing');
		logger.error("the string YOUR_USER by the correct user's name:");
		logger.error('');
		logger.error('   db.runCommand({ grantRolesToUser: "YOUR_USER" , roles: [{role: "clusterMonitor", db: "admin"}]})');
		logger.error('');
		logger.error('==================================');
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
