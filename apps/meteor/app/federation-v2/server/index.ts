import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

export const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
export const queueInstance = FederationFactory.buildFederationQueue();
rocketSettingsAdapter.initialize();
export const federationQueueInstance = FederationFactory.buildFederationQueue();
const federationBridge = FederationFactory.buildFederationBridge(rocketSettingsAdapter, federationQueueInstance);
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

const federationEventsHandler = FederationFactory.buildFederationEventHandler(federationRoomServiceReceiver, rocketSettingsAdapter);

export const federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationRoomInternalHooksValidator = FederationFactory.buildRoomInternalHooksValidator(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

FederationFactory.setupListeners(federationRoomServiceSender, federationRoomInternalHooksValidator);
let cancelSettingsObserver: () => void;

export const runFederation = async (): Promise<void> => {
	federationQueueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	cancelSettingsObserver = rocketSettingsAdapter.onFederationEnabledStatusChanged(
		federationBridge.onFederationAvailabilityChanged.bind(federationBridge),
	);
	if (!rocketSettingsAdapter.isFederationEnabled()) {
		return;
	}
	await federationBridge.start();
	federationBridge.logFederationStartupInfo('Running Federation V2');
	require('./infrastructure/rocket-chat/slash-commands');
};

export const stopFederation = async (): Promise<void> => {
	FederationFactory.removeListeners();
	await federationBridge.stop();
	cancelSettingsObserver();
};

(async (): Promise<void> => {
	await runFederation();
})();
