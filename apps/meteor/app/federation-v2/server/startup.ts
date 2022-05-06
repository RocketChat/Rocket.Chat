import { settings } from '../../settings/server';
import { matrixBridge } from './bridge';
import { bridgeUrlTuple } from './config';
import { bridgeLogger, setupLogger } from './logger';
import { isFederationMatrixEnabled } from './tools';

((): void => {
	if (!isFederationMatrixEnabled()) return;

	bridgeLogger.info(`Running Federation V2:
	  id: ${settings.get('Federation_Matrix_id')}
	  bridgeUrl: ${settings.get<string>('Federation_Matrix_bridge_url')}
	  homeserverURL: ${settings.get('Federation_Matrix_homeserver_url')}
	  homeserverDomain: ${settings.get('Federation_Matrix_homeserver_domain')}
	`);

	const [, , port] = settings.get<string>('Federation_Matrix_bridge_url').split(':') as bridgeUrlTuple;

	matrixBridge.run(port);

	// TODO: Changes here should re-initialize the bridge instead of needing a restart
	// Add settings listeners
	settings.watch('Federation_Matrix_enabled', (value) => {
		setupLogger.info(`Federation Matrix is ${value ? 'enabled' : 'disabled'}`);
	});
})();
