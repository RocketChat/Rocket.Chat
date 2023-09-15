import crypto from 'crypto';

// import { MongoInternals } from 'meteor/mongo';
import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

import { settingsRegistry, settings } from '../../app/settings/server';

interface Fingerprint {
	site_url: string;
	db_connection_string: string;
}

// TODO:
// Apis to set as new deploy or update
// On update list variables to re generate / cleanup
// Modal to request action
// Process on site_url change

const logger = new Logger('FingerPrint');

const generateFingerprint = function () {
	const siteUrl = settings.get('Site_Url');
	const dbConnectionString = process.env.MONGO_URL;

	const fingerprint = `${siteUrl}${dbConnectionString}`;
	console.log(fingerprint);
	return crypto.createHash('sha256').update(fingerprint).digest('base64');
};

const updateFingerprint = async function (fingerprint: string, verified: boolean) {
	await Settings.updateOne(
		{ _id: 'Deployment_FingerPrint_Hash' },
		{
			$set: {
				value: fingerprint,
			},
		},
	);

	await Settings.updateOne(
		{ _id: 'Deployment_FingerPrint_Verified' },
		{
			$set: {
				value: verified,
			},
		},
	);
};

const verifyFingerPrint = async function () {
	const DeploymentFingerPrintRecordHash = await Settings.getValueById('Deployment_FingerPrint_Hash');

	const fingerprint = generateFingerprint();

	console.log(DeploymentFingerPrintRecordHash);
	if (!DeploymentFingerPrintRecordHash) {
		logger.info('Generating fingerprint for the first time');
		await updateFingerprint(fingerprint, true);
		return;
	}

	if (DeploymentFingerPrintRecordHash === fingerprint) {
		return;
	}

	if (fingerprint === process.env.EXPECTED_FINGERPRINT) {
		logger.info('Updating fingerprint as matched by env var EXPECTED_FINGERPRINT', fingerprint);
		await updateFingerprint(fingerprint, true);
	}

	logger.warn('Updating fingerprint as pending for admin verification', fingerprint);
	await updateFingerprint(fingerprint, false);
};

settings.watch('Site_Url', () => {
	void verifyFingerPrint();
});

// Insert server unique id if it doesn't exist
export const createMiscSettings = async () => {
	await settingsRegistry.add('uniqueID', process.env.DEPLOYMENT_ID || uuidv4(), {
		public: true,
	});

	await settingsRegistry.add('Deployment_FingerPrint_Hash', '', {
		public: false,
		blocked: true,
		// hidden: true,
		// secret: true,
	});

	await settingsRegistry.add('Deployment_FingerPrint_Verified', false, {
		type: 'boolean',
		public: true,
		blocked: true,
		// hidden: true,
	});

	await verifyFingerPrint();

	await settingsRegistry.add('Initial_Channel_Created', false, {
		type: 'boolean',
		hidden: true,
	});
};
