import { runFederation, stopFederation, rocketSettingsAdapter, federationQueueInstance } from '../../../../app/federation-v2/server';
import { onToggledFeature } from '../../license/server/license';
import { FederationFactoryEE } from './infrastructure/Factory';

const federationBridgeEE = FederationFactoryEE.buildBridge(rocketSettingsAdapter, federationQueueInstance);
const rocketRoomAdapterEE = FederationFactoryEE.buildRocketRoomAdapter();
const rocketUserAdapterEE = FederationFactoryEE.buildRocketUserAdapter();
const rocketNotificationAdapterEE = FederationFactoryEE.buildRocketNotificationdapter();

export const federationRoomServiceSenderEE = FederationFactoryEE.buildRoomServiceSender(
	rocketRoomAdapterEE,
	rocketUserAdapterEE,
	rocketSettingsAdapter,
	rocketNotificationAdapterEE,
	federationBridgeEE,
);

const runFederationEE = async (): Promise<void> => {
	await federationBridgeEE.start();
	federationBridgeEE.logFederationStartupInfo('Running Federation Enterprise V2');
};

let cancelSettingsObserverEE: Function;

onToggledFeature('federation', {
	up: async () => {
		cancelSettingsObserverEE = rocketSettingsAdapter.onFederationEnabledStatusChanged(
			federationBridgeEE.onFederationAvailabilityChanged.bind(federationBridgeEE),
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
		await federationBridgeEE.stop();
		await runFederation();
		FederationFactoryEE.removeListeners();
		cancelSettingsObserverEE();
	},
});
