import {
	runFederation,
	stopFederation,
	rocketSettingsAdapter,
	federationQueueInstance,
	rocketMessageAdapter,
	rocketFileAdapter,
	rocketNotificationAdapter,
} from '../../../../app/federation-v2/server';
import type { IFederationBridgeRegistrationFile } from '../../../../app/federation-v2/server/domain/IFederationBridge';
import { onToggledFeature } from '../../license/server/license';
import { FederationFactoryEE } from './infrastructure/Factory';

const federationBridgeEE = FederationFactoryEE.buildBridge(rocketSettingsAdapter, federationQueueInstance);
const rocketRoomAdapterEE = FederationFactoryEE.buildRocketRoomAdapter();
const rocketUserAdapterEE = FederationFactoryEE.buildRocketUserAdapter();

export const federationRoomServiceSenderEE = FederationFactoryEE.buildRoomServiceSender(
	rocketRoomAdapterEE,
	rocketUserAdapterEE,
	rocketFileAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	rocketNotificationAdapter,
	federationBridgeEE,
);

export const federationRoomInternalHooksServiceSenderEE = FederationFactoryEE.buildRoomInternalHooksServiceSender(
	rocketRoomAdapterEE,
	rocketUserAdapterEE,
	rocketFileAdapter,
	rocketSettingsAdapter,
	rocketMessageAdapter,
	federationBridgeEE,
);

export const federationDMRoomInternalHooksServiceSenderEE = FederationFactoryEE.buildDMRoomInternalHooksServiceSender(
	rocketRoomAdapterEE,
	rocketUserAdapterEE,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridgeEE,
);

const runFederationEE = async (): Promise<void> => {
	await federationBridgeEE.start();
	federationBridgeEE.logFederationStartupInfo('Running Federation Enterprise V2');
};

let cancelSettingsObserverEE: () => void;

const onFederationEnabledStatusChangedEE = async (
	isFederationEnabled: boolean,
	appServiceId: string,
	homeServerUrl: string,
	homeServerDomain: string,
	bridgeUrl: string,
	bridgePort: number,
	homeServerRegistrationFile: IFederationBridgeRegistrationFile,
): Promise<void> => {
	federationBridgeEE.onFederationAvailabilityChanged(
		isFederationEnabled,
		appServiceId,
		homeServerUrl,
		homeServerDomain,
		bridgeUrl,
		bridgePort,
		homeServerRegistrationFile,
	);
	if (isFederationEnabled) {
		FederationFactoryEE.setupListeners(
			federationRoomInternalHooksServiceSenderEE,
			federationDMRoomInternalHooksServiceSenderEE,
			rocketSettingsAdapter,
		);
		await import('./infrastructure/rocket-chat/slash-commands');
		return;
	}
	FederationFactoryEE.removeListeners();
};

onToggledFeature('federation', {
	up: async () => {
		await stopFederation(federationRoomServiceSenderEE);
		cancelSettingsObserverEE = rocketSettingsAdapter.onFederationEnabledStatusChanged(
			onFederationEnabledStatusChangedEE.bind(onFederationEnabledStatusChangedEE),
		);
		if (!rocketSettingsAdapter.isFederationEnabled()) {
			return;
		}
		await runFederationEE();
		FederationFactoryEE.setupListeners(
			federationRoomInternalHooksServiceSenderEE,
			federationDMRoomInternalHooksServiceSenderEE,
			rocketSettingsAdapter,
		);
		await import('./infrastructure/rocket-chat/slash-commands');
	},
	down: async () => {
		await federationBridgeEE.stop();
		cancelSettingsObserverEE();
		FederationFactoryEE.removeListeners();
		await runFederation();
	},
});
