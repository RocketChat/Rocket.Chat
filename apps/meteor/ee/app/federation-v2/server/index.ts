import { federationQueueInstance, runFederation, stopFederation } from '../../../../app/federation-v2/server';
import { FederationFactory } from '../../../../app/federation-v2/server/infrastructure/Factory';
import { onToggledFeature } from '../../license/server/license';
import { FederationFactoryEE } from './infrastructure/Factory';

const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
const federationEE = FederationFactoryEE.buildBridge(rocketSettingsAdapter, federationQueueInstance);
const rocketRoomAdapter = FederationFactoryEE.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactoryEE.buildRocketUserAdapter();
const rocketNotificationAdapter = FederationFactoryEE.buildRocketNotificationdapter();

export const federationRoomServiceSenderEE = FederationFactoryEE.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	rocketNotificationAdapter,
	federationEE,
);

const runFederationEE = async (): Promise<void> => {
	await federationEE.start();
};

let cancelSettingsObserverEE: () => void;

onToggledFeature('federation', {
	up: async () => {
		cancelSettingsObserverEE = rocketSettingsAdapter.onFederationEnabledStatusChanged(
			federationEE.onFederationAvailabilityChanged.bind(federationEE),
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
		await federationEE.stop();
		await runFederation();
		FederationFactoryEE.removeListeners();
		cancelSettingsObserverEE();
	},
});
