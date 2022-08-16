import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
rocketSettingsAdapter.initialize();
export const federationQueueInstance = FederationFactory.buildQueue();
const federation = FederationFactory.buildBridge(rocketSettingsAdapter, federationQueueInstance);
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
let cancelSettingsObserver: () => void;

export const runFederation = async (): Promise<void> => {
	federationQueueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	cancelSettingsObserver = rocketSettingsAdapter.onFederationEnabledStatusChanged(
		federation.onFederationAvailabilityChanged.bind(federation),
	);
	if (!rocketSettingsAdapter.isFederationEnabled()) {
		return;
	}
	await federation.start();
	require('./infrastructure/rocket-chat/slash-commands');
};

export const stopFederation = async (): Promise<void> => {
	FederationFactory.removeListeners();
	await federation.stop();
	cancelSettingsObserver();
};

(async (): Promise<void> => {
	await runFederation();
})();
