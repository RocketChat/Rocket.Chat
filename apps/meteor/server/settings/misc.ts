import { Random } from '@rocket.chat/random';

import { settingsRegistry } from '../../app/settings/server';

// Insert server unique id if it doesn't exist
export const createMiscSettings = async () => {
	await settingsRegistry.add('uniqueID', process.env.DEPLOYMENT_ID || Random.id(), {
		public: true,
	});

	await settingsRegistry.add('Initial_Channel_Created', false, {
		type: 'boolean',
		hidden: true,
	});
};
