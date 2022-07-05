import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
rocketSettingsAdapter.initialize();
const queueInstance = FederationFactory.buildQueue();
const federation = FederationFactory.buildBridge(rocketSettingsAdapter, queueInstance);
const rocketRoomAdapter = FederationFactory.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactory.buildRocketUserAdapter();
const rocketMessageAdapter = FederationFactory.buildRocketMessageAdapter();

const federationRoomServiceReceiver = FederationFactory.buildRoomServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	federation,
);

const federationEventsHandler = FederationFactory.buildEventHandlers(federationRoomServiceReceiver, rocketSettingsAdapter);

export const federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	federation,
);

FederationFactory.setupListeners(federationRoomServiceSender);
rocketSettingsAdapter.onFederationEnabledStatusChanged(federation.onFederationAvailabilityChanged.bind(federation));

export const runFederation = async (): Promise<void> => {
	if (!rocketSettingsAdapter.isFederationEnabled()) {
		return;
	}
	queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	await federation.start();
	require('./infrastructure/rocket-chat/slash-commands');
};

export const stopFederation = async (): Promise<void> => {
	FederationFactory.removeListeners();
	await federation.stop();
};

(async (): Promise<void> => {
	await runFederation();
})();
