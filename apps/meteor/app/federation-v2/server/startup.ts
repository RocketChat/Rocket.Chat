import { settings } from '../../settings/server';
import { matrixBridge } from './bridge';
import { bridgeLogger, setupLogger } from './logger';

const watchChanges = (): void => {
	settings.watchMultiple(
		[
			'Federation_Matrix_enabled',
			'Federation_Matrix_id',
			'Federation_Matrix_hs_token',
			'Federation_Matrix_as_token',
			'Federation_Matrix_homeserver_url',
			'Federation_Matrix_homeserver_domain',
			'Federation_Matrix_bridge_url',
			'Federation_Matrix_bridge_localpart',
		],
		async ([enabled]) => {
			setupLogger.info(`Federation Matrix is ${enabled ? 'enabled' : 'disabled'}`);
			if (!enabled) {
				await matrixBridge.stop();
				return;
			}
			await matrixBridge.start();
		},
	);
};

export const startBridge = (): void => {
	watchChanges();

	bridgeLogger.info(`Running Federation V2:
	  id: ${settings.get<string>('Federation_Matrix_id')}
	  bridgeUrl: ${settings.get<string>('Federation_Matrix_bridge_url')}
	  homeserverURL: ${settings.get<string>('Federation_Matrix_homeserver_url')}
	  homeserverDomain: ${settings.get<string>('Federation_Matrix_homeserver_domain')}
	`);
};
