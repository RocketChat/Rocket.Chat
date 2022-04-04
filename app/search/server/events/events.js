import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { searchProviderService } from '../service/providerService';
import SearchLogger from '../logger/logger';

class EventService {
	_pushError(name, value /* , payload */) {
		// TODO implement a (performant) cache
		SearchLogger.debug(`Error on event '${name}' with id '${value}'`);
	}

	promoteEvent(name, value, payload) {
		if (!(searchProviderService.activeProvider && searchProviderService.activeProvider.on(name, value, payload))) {
			this._pushError(name, value, payload);
		}
	}
}

export const searchEventService = new EventService();

/**
 * Listen to message changes via Hooks
 */
function afterSaveMessage(m) {
	searchEventService.promoteEvent('message.save', m._id, m);
	return m;
}

function afterDeleteMessage(m) {
	searchEventService.promoteEvent('message.delete', m._id);
	return m;
}
settings.watch('Search.Provider', () => {
	if (searchProviderService.activeProvider?.on) {
		callbacks.add('afterSaveMessage', afterSaveMessage, callbacks.priority.MEDIUM, 'search-events');
		callbacks.add('afterDeleteMessage', afterDeleteMessage, callbacks.priority.MEDIUM, 'search-events-delete');
	} else {
		callbacks.remove('afterSaveMessage', 'search-events');
		callbacks.remove('afterDeleteMessage', 'search-events-delete');
	}
});
