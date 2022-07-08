import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

export const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
export const queueInstance = FederationFactory.buildQueue();
rocketSettingsAdapter.initialize();
const federationBridge = FederationFactory.buildBridge(rocketSettingsAdapter, queueInstance);
const rocketRoomAdapter = FederationFactory.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactory.buildRocketUserAdapter();
const rocketMessageAdapter = FederationFactory.buildRocketMessageAdapter();

const federationRoomServiceReceiver = FederationFactory.buildRoomServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationEventsHandler = FederationFactory.buildEventHandler(federationRoomServiceReceiver, rocketSettingsAdapter);

export const federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

FederationFactory.setupListeners(federationRoomServiceSender);
rocketSettingsAdapter.onFederationEnabledStatusChanged(federationBridge.onFederationAvailabilityChanged.bind(federationBridge));

export const runFederation = async (): Promise<void> => {
	if (!rocketSettingsAdapter.isFederationEnabled()) {
		return;
	}
	queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	await federationBridge.start();
	federationBridge.logFederationStartupInfo('Running Federation V2');
	require('./infrastructure/rocket-chat/slash-commands');
};

export const stopFederation = async (): Promise<void> => {
	FederationFactory.removeListeners();
	await federationBridge.stop();
};

(async (): Promise<void> => {
	await runFederation();
})();
