import type { FederationMatrix } from '../FederationMatrix';
import { reaction, removeReactionListeners } from './reaction';
import type { ICallbacks } from '../types/ICallbacks';

export function registerHooks(federationMatrixService: FederationMatrix, callbacks?: ICallbacks) {
	if (callbacks) {
		reaction(federationMatrixService, callbacks);
	}
}

export function removeAllHooks(callbacks?: ICallbacks) {
	removeReactionListeners(callbacks);
}
