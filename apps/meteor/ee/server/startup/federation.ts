import { api } from '@rocket.chat/core-services';
import { FederationMatrix } from '@rocket.chat/federation-matrix';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { settings } from '../../../app/settings/server';
import { StreamerCentral } from '../../../server/modules/streamer/streamer.module';
import { registerFederationRoutes } from '../api/federation';

const logger = new Logger('Federation');

// TODO: should validate if the domain is resolving to us or not correctly
// should use homeserver.getFinalSomethingSomething and validate final Host header to have siteUrl
// this is a minimum sanity check to avoid full urls instead of the expected domain part
function validateDomain(domain: string): boolean {
	const value = domain.trim();

	if (!value) {
		logger.error('The Federation domain is not set');
		return false;
	}

	if (value.toLowerCase() != value) {
		logger.error(`The Federation domain "${value}" cannot have uppercase letters`);
		return false;
	}

	try {
		const valid = new URL(`https://${value}`).hostname === value;

		if (!valid) {
			throw;
		}
	} catch {
		logger.error(`The configured Federation domain "${value}" is not valid`);
		return false;
	}

	return true;
}

export const startFederationService = async (): Promise<void> => {
	let federationMatrixService: FederationMatrix | undefined;

	const shouldStartService = (): boolean => {
		const hasLicense = License.hasModule('federation');
		const isEnabled = settings.get('Federation_Service_Enabled') === true;
		const domain = settings.get<string>('Federation_Service_Domain');
		const hasDomain = validateDomain(domain);
		return hasLicense && isEnabled && hasDomain;
	};

	const startService = async (): Promise<void> => {
		if (federationMatrixService) {
			logger.debug('Federation-matrix service already started... skipping');
			return;
		}

		logger.debug('Starting federation-matrix service');
		federationMatrixService = await FederationMatrix.create(InstanceStatus.id());

		StreamerCentral.on('broadcast', (name, eventName, args) => {
			if (!federationMatrixService) {
				return;
			}
			if (name === 'notify-room' && eventName.endsWith('user-activity')) {
				const [rid] = eventName.split('/');
				const [user, activity] = args;
				void federationMatrixService.notifyUserTyping(rid, user, activity.includes('user-typing'));
			}
		});

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

	settings.watch<string>('Federation_Service_Domain', async (domain) => {
		logger.debug('Federation_Service_Domain setting changed:', domain);
		if (shouldStartService()) {
			if (domain.toLowerCase() !== federationMatrixService?.getServerName().toLowerCase()) {
				await stopService();
			}
			await startService();
		} else {
			await stopService();
		}
	});
};
