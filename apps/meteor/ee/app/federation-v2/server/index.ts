import { FEDERATION_PROCESSING_CONCURRENCY, runFederation, stopFederation } from '../../../../app/federation-v2/server';
import { FederationFactory } from '../../../../app/federation-v2/server/infrastructure/Factory';
import { onToggledFeature } from '../../license/server/license';
import { FederationFactoryEE } from './infrastructure/Factory';

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
const queueInstance = FederationFactory.buildQueue();
const federationEE = FederationFactoryEE.buildBridge(rocketSettingsAdapter, queueInstance);
const rocketRoomAdapter = FederationFactoryEE.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactoryEE.buildRocketUserAdapter();
const rocketMessageAdapter = FederationFactory.buildRocketMessageAdapter();
const rocketNotificationAdapter = FederationFactoryEE.buildRocketNotificationdapter();

const federationRoomServiceReceiver = FederationFactoryEE.buildRoomServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	federationEE,
);
const federationEventsHandler = FederationFactoryEE.buildEventHandlers(federationRoomServiceReceiver, rocketSettingsAdapter);

export const federationRoomServiceSenderEE = FederationFactoryEE.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	rocketNotificationAdapter,
	federationEE,
);

const runFederationEE = async (): Promise<void> => {
	queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	await federationEE.start();
};

let cancelSettingsObserverEE: Function;

onToggledFeature('federation', {
	up: async () => {
		queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
		cancelSettingsObserverEE = rocketSettingsAdapter.onFederationEnabledStatusChanged(
			federationEE.onFederationAvailabilityChanged.bind(federationEE),
		);
		if (!rocketSettingsAdapter.isFederationEnabled()) {
			return;
		}
		await stopFederation();
		await runFederationEE();
		FederationFactoryEE.setupListeners(federationRoomServiceSenderEE, rocketSettingsAdapter);
		require('./infrastructure/rocket-chat/slash-commands');
	},
	down: async () => {
		await federationEE.stop();
		await runFederation();
		FederationFactoryEE.removeListeners();
		cancelSettingsObserverEE();
	},
});
