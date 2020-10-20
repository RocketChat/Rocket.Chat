import _ from 'underscore';

import { settings } from '../../../settings/server';
import { callbacks } from '../../../callbacks/server';
import { Users, Rooms } from '../../../models/server';
import { searchProviderService } from '../service/providerService';
import SearchLogger from '../logger/logger';

class EventService {
	_pushError(name, value/* , payload */) {
		// TODO implement a (performant) cache
		SearchLogger.debug(`Error on event '${ name }' with id '${ value }'`);
	}

	promoteEvent(name, value, payload) {
		if (!(searchProviderService.activeProvider && searchProviderService.activeProvider.on(name, value, payload))) {
			this._pushError(name, value, payload);
		}
	}
}

const eventService = new EventService();

/**
 * Listen to message changes via Hooks
 */
function afterSaveMessage(m) {
	eventService.promoteEvent('message.save', m._id, m);
	return m;
}

function afterDeleteMessage(m) {
	eventService.promoteEvent('message.delete', m._id);
	return m;
}

/**
 * Listen to user and room changes via cursor
 */
function onUsersChange({ clientAction, id, data }) {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const user = data ?? Users.findOneById(id);
			eventService.promoteEvent('user.save', id, user);
			break;

		case 'removed':
			eventService.promoteEvent('user.delete', id);
			break;
	}
}

function onRoomsChange({ clientAction, id, data }) {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const room = data ?? Rooms.findOneById(id);
			eventService.promoteEvent('room.save', id, room);
			break;

		case 'removed':
			eventService.promoteEvent('room.delete', id);
			break;
	}
}

settings.get('Search.Provider', _.debounce(() => {
	if (searchProviderService.activeProvider?.on) {
		Users.on('change', onUsersChange);
		Rooms.on('change', onRoomsChange);
		callbacks.add('afterSaveMessage', afterSaveMessage, callbacks.priority.MEDIUM, 'search-events');
		callbacks.add('afterDeleteMessage', afterDeleteMessage, callbacks.priority.MEDIUM, 'search-events-delete');
	} else {
		Users.removeListener('change', onUsersChange);
		Rooms.removeListener('change', onRoomsChange);
		callbacks.remove('afterSaveMessage', 'search-events');
		callbacks.remove('afterDeleteMessage', 'search-events-delete');
	}
}, 1000));
