import { FederationFactoryEE } from '../../../ee/app/federation-v2/server/infrastructure/Factory';
import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
rocketSettingsAdapter.initialize();
const queueInstance = FederationFactory.buildQueue();
const federation = FederationFactoryEE.buildBridge(rocketSettingsAdapter, queueInstance);
const rocketRoomAdapter = FederationFactoryEE.buildRocketRoomAdapter();
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

export const runFederation = async (): Promise<void> => {
	queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);

	await federation.start();

	await rocketSettingsAdapter.onFederationEnabledStatusChanged(federation.onFederationAvailabilityChanged.bind(federation));
	require('./infrastructure/rocket-chat/slash-commands');

	FederationFactory.setupListeners(federationRoomServiceSender);
};

export const stopFederation = async (): Promise<void> => {
	FederationFactory.removeListeners();
	await federation.stop();
};

(async (): Promise<void> => {
	await runFederation();
})();
