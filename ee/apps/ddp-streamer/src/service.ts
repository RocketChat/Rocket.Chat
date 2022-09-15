import { api } from '../../../../apps/meteor/server/sdk/api';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';

(async () => {
	api.setBroker(broker);

	// need to import service after models are registered
	const { DDPStreamer } = await import('./DDPStreamer');

	api.registerService(new DDPStreamer());

	await api.start();
})();
