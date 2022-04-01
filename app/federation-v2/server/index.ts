import { matrixBridge } from './bridge';
import { bridgeUrlTuple, config } from './config';
import { bridgeLogger } from './logger';

((): void => {
	if (!matrixBridge) return;

	bridgeLogger.info(`Running Federation V2:
	  id: ${config.id}
	  bridgeUrl: ${config.bridgeUrl}
	  homeserverURL: ${config.homeserverUrl}
	  homeserverDomain: ${config.homeserverDomain}
	`);

	const [, port] = config.bridgeUrl.split(':') as bridgeUrlTuple;

	matrixBridge?.run(port);
})();
