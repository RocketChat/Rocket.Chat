import { searchProviderService } from '../service';
import { SearchLogger } from '../logger/logger';

export class EventService {
	_pushError(name: string, value: string, _payload?: unknown) {
		// TODO implement a (performant) cache
		SearchLogger.debug(`Error on event '${name}' with id '${value}'`);
	}

	promoteEvent(name: string, value: string, payload?: unknown) {
		if (!searchProviderService.activeProvider?.on(name, value)) {
			this._pushError(name, value, payload);
		}
	}
}
