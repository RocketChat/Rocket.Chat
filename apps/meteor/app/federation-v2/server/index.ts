import { FederationFactoryEE } from '../../../ee/app/federation-v2/server/infrastructure/Factory';
import { FederationFactory } from './infrastructure/Factory';
import './infrastructure/rocket-chat/slash-commands';
// eslint-disable-next-line import/no-duplicates
import { rocketChatRoomCallbacksHandler } from './infrastructure/rocket-chat/callbacks/room';
// eslint-disable-next-line import/no-duplicates
import './infrastructure/rocket-chat/callbacks/room';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
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
const federationEventsHandler = FederationFactory.buildEventHandlers(federationRoomServiceReceiver);

export const federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	federation,
);

export const runFederation = async (): Promise<void> => {
	queueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);

	await federation.start();

	rocketChatRoomCallbacksHandler.injectBridgeInstance(federation);

	await rocketSettingsAdapter.onFederationEnabledStatusChanged(federation.onFederationAvailabilityChanged.bind(federation));
};

export const stopFederation = async (): Promise<void> => {
	await federation.stop();
};

(async (): Promise<void> => {
	await runFederation();
})();
