import {
	FEDERATION_PROCESSING_CONCURRENCY,
	runFederation,
	stopFederation,
	rocketSettingsAdapter,
	queueInstance,
} from '../../../../app/federation-v2/server';
import { FederationFactory } from '../../../../app/federation-v2/server/infrastructure/Factory';
import { onToggledFeature } from '../../license/server/license';
import { FederationFactoryEE } from './infrastructure/Factory';

const federationBridgeEE = FederationFactoryEE.buildBridge(rocketSettingsAdapter, queueInstance);
const rocketRoomAdapterEE = FederationFactoryEE.buildRocketRoomAdapter();
const rocketUserAdapterEE = FederationFactoryEE.buildRocketUserAdapter();
const rocketMessageAdapterEE = FederationFactory.buildRocketMessageAdapter();
const rocketNotificationAdapterEE = FederationFactoryEE.buildRocketNotificationdapter();

const federationRoomServiceReceiverEE = FederationFactoryEE.buildRoomServiceReceiver(
	rocketRoomAdapterEE,
	rocketUserAdapterEE,
	rocketMessageAdapterEE,
	rocketSettingsAdapter,
	federationBridgeEE,
);
const federationEventsHandlerEE = FederationFactoryEE.buildEventHandlers(federationRoomServiceReceiverEE, rocketSettingsAdapter);

export const federationRoomServiceSenderEE = FederationFactoryEE.buildRoomServiceSender(
	rocketRoomAdapterEE,
	rocketUserAdapterEE,
	rocketSettingsAdapter,
	rocketNotificationAdapterEE,
	federationBridgeEE,
);

const runFederationEE = async (): Promise<void> => {
	queueInstance.setHandler(federationEventsHandlerEE.handleEvent.bind(federationEventsHandlerEE), FEDERATION_PROCESSING_CONCURRENCY);
	await federationBridgeEE.start();
	federationBridgeEE.logFederationStartupInfo('Running Federation Enterprise V2');
};

onToggledFeature('federation', {
	up: async () => {
		if (!rocketSettingsAdapter.isFederationEnabled()) {
			return;
		}
		await stopFederation();
		await runFederationEE();
		FederationFactoryEE.setupListeners(federationRoomServiceSenderEE, rocketSettingsAdapter);
		require('./infrastructure/rocket-chat/slash-commands');
	},
	down: async () => {
		await federationBridgeEE.stop();
		await runFederation();
		FederationFactoryEE.removeListeners();
	},
});
