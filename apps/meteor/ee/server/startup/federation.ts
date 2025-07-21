import { api } from '@rocket.chat/core-services';
import { FederationMatrix } from '@rocket.chat/federation-matrix';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { settings } from '../../../app/settings/server';
import { registerFederationRoutes } from '../api/federation';

const logger = new Logger('Federation');

export const startFederationService = async (): Promise<void> => {
	let federationMatrixService: FederationMatrix | undefined;

	const shouldStartService = (): boolean => {
		const hasLicense = License.hasModule('federation');
		const isEnabled = settings.get('Federation_Service_Enabled') === true;
		return hasLicense && isEnabled;
	};

	const startService = async (): Promise<void> => {
		if (federationMatrixService) {
			logger.debug('Federation-matrix service already started... skipping');
			return;
		}

		logger.debug('Starting federation-matrix service');
		federationMatrixService = await FederationMatrix.create();

		try {
			api.registerService(federationMatrixService);
			await registerFederationRoutes(federationMatrixService);
		} catch (error) {
			logger.error('Failed to start federation-matrix service:', error);
		}
	};

	const stopService = async (): Promise<void> => {
		if (!federationMatrixService) {
			logger.debug('Federation-matrix service not registered... skipping');
			return;
		}

		logger.debug('Stopping federation-matrix service');

		// TODO: Unregister routes
		// await unregisterFederationRoutes(federationMatrixService);

		await api.destroyService(federationMatrixService);
		federationMatrixService = undefined;
	};

	if (shouldStartService()) {
		await startService();
	}

	void License.onLicense('federation', async () => {
		logger.debug('Federation license became available');
		if (shouldStartService()) {
			await startService();
		}
	});

	License.onInvalidateLicense(async () => {
		logger.debug('License invalidated, checking federation module');
		if (!shouldStartService()) {
			await stopService();
		}
	});

	settings.watch('Federation_Service_Enabled', async (enabled) => {
		logger.debug('Federation_Service_Enabled setting changed:', enabled);
		if (shouldStartService()) {
			await startService();
		} else {
			await stopService();
		}
	});
};
