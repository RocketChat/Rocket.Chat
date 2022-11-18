import type { FederationRoomServiceSender } from './application/sender/RoomServiceSender';
import type { IFederationBridgeRegistrationFile } from './domain/IFederationBridge';
import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

export const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
export const queueInstance = FederationFactory.buildFederationQueue();
rocketSettingsAdapter.initialize();
export const federationQueueInstance = FederationFactory.buildFederationQueue();
export const rocketFileAdapter = FederationFactory.buildRocketFileAdapter();
const federationBridge = FederationFactory.buildFederationBridge(rocketSettingsAdapter, federationQueueInstance);
const rocketRoomAdapter = FederationFactory.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactory.buildRocketUserAdapter();
export const rocketNotificationAdapter = FederationFactory.buildRocketNotificationAdapter();
export const rocketMessageAdapter = FederationFactory.buildRocketMessageAdapter();

const federationRoomServiceReceiver = FederationFactory.buildRoomServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	rocketNotificationAdapter,
	federationBridge,
);

const federationMessageServiceReceiver = FederationFactory.buildMessageServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationUserServiceReceiver = FederationFactory.buildUserServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketFileAdapter,
	rocketNotificationAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationEventsHandler = FederationFactory.buildFederationEventHandler(
	federationRoomServiceReceiver,
	federationMessageServiceReceiver,
	federationUserServiceReceiver,
	rocketSettingsAdapter,
);

export let federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketFileAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	rocketNotificationAdapter,
	federationBridge,
);

const federationRoomInternalHooksValidator = FederationFactory.buildRoomInternalHooksValidator(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

export const federationUserServiceSender = FederationFactory.buildUserServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationMessageServiceSender = FederationFactory.buildMessageServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	rocketMessageAdapter,
	federationBridge,
);

let cancelSettingsObserver: () => void;

const onFederationEnabledStatusChanged = async (
	isFederationEnabled: boolean,
	appServiceId: string,
	homeServerUrl: string,
	homeServerDomain: string,
	bridgeUrl: string,
	bridgePort: number,
	homeServerRegistrationFile: IFederationBridgeRegistrationFile,
): Promise<void> => {
	federationBridge.onFederationAvailabilityChanged(
		isFederationEnabled,
		appServiceId,
		homeServerUrl,
		homeServerDomain,
		bridgeUrl,
		bridgePort,
		homeServerRegistrationFile,
	);
	if (isFederationEnabled) {
		federationBridge.logFederationStartupInfo('Running Federation V2');
		FederationFactory.setupActions(federationRoomServiceSender, federationMessageServiceSender);
		await import('./infrastructure/rocket-chat/slash-commands');
		return;
	}
	FederationFactory.removeCEListeners();
};

export const runFederation = async (): Promise<void> => {
	federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
		rocketRoomAdapter,
		rocketUserAdapter,
		rocketFileAdapter,
		rocketMessageAdapter,
		rocketSettingsAdapter,
		rocketNotificationAdapter,
		federationBridge,
	);
	FederationFactory.setupValidators(federationRoomInternalHooksValidator);
	federationQueueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	cancelSettingsObserver = rocketSettingsAdapter.onFederationEnabledStatusChanged(
		onFederationEnabledStatusChanged.bind(onFederationEnabledStatusChanged),
	);
	await rocketNotificationAdapter.subscribeToUserTypingEventsOnFederatedRooms(
		rocketNotificationAdapter.broadcastUserTypingOnRoom.bind(rocketNotificationAdapter),
	);
	if (!rocketSettingsAdapter.isFederationEnabled()) {
		return;
	}
	FederationFactory.setupActions(federationRoomServiceSender, federationMessageServiceSender);
	await federationBridge.start();
	federationBridge.logFederationStartupInfo('Running Federation V2');
	await import('./infrastructure/rocket-chat/slash-commands');
};

const updateServiceSenderInstance = (federationRoomServiceSenderInstance: FederationRoomServiceSender) => {
	federationRoomServiceSender = federationRoomServiceSenderInstance;
};

export const stopFederation = async (federationRoomServiceSenderInstance: FederationRoomServiceSender): Promise<void> => {
	updateServiceSenderInstance(federationRoomServiceSenderInstance);
	FederationFactory.removeCEListeners();
	await federationBridge.stop();
	cancelSettingsObserver();
};

(async (): Promise<void> => {
	await runFederation();
})();
