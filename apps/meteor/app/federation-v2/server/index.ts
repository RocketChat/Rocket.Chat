import { FederationFactory } from './infrastructure/Factory';

const PROCESSING_CONCURRENCY = 1;

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
rocketSettingsAdapter.initialize();
const queueInstance = FederationFactory.buildQueue();
const federation = FederationFactory.buildBridge(rocketSettingsAdapter, queueInstance);
const rocketRoomAdapter = FederationFactory.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactory.buildRocketUserAdapter();
const rocketMessageAdapter = FederationFactory.buildRocketMessageAdapter();
const rocketNotificationAdapter = FederationFactory.buildRocketNotificationdapter();

const federationRoomServiceReceiver = FederationFactory.buildRoomServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	federation,
);
const federationEventsHandler = FederationFactory.buildEventHandlers(federationRoomServiceReceiver);

export const federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	rocketNotificationAdapter,
	federation,
);

(async (): Promise<void> => {
	queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), PROCESSING_CONCURRENCY);
	await federation.start();
	await rocketSettingsAdapter.onFederationEnabledStatusChanged(federation.onFederationAvailabilityChanged.bind(federation));
})();
