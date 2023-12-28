import { api } from '@rocket.chat/core-services';

import { LicenseService } from '../../ee/app/license/server/license.internalService';
import { isRunningMs } from '../lib/isRunningMs';

export const startCoreDependencies = async (): Promise<void> => {
	api.registerService(new LicenseService());

	await require('../services/startup');

	if (!isRunningMs()) {
		require('./localServices');
		require('./watchDb');
	} else {
		const { broker } = await require('../../ee/server/startup/broker');

		api.setBroker(broker);

		await api.start();
		await require('../settings/index');
		await require('../../app/settings/server');
		await require('./migrations');
	}
};
