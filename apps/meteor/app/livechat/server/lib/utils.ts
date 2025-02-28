import { RoutingManager } from './RoutingManager';

export function showConnecting() {
	return RoutingManager.getConfig()?.showConnecting || false;
}
