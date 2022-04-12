import { matrixBridge } from './bridge';
import { bridgeUrlTuple, config } from './config';
import { bridgeLogger } from './logger';
import './settings';
import { isFederationV2Enabled } from './tools';

((): void => {
	if (!isFederationV2Enabled()) return;

	bridgeLogger.info(`Running Federation V2:
	  id: ${config.id}
	  bridgeUrl: ${config.bridgeUrl}
	  homeserverURL: ${config.homeserverUrl}
	  homeserverDomain: ${config.homeserverDomain}
	`);

	const [, , port] = config.bridgeUrl.split(':') as bridgeUrlTuple;

	matrixBridge.run(port);
})();
