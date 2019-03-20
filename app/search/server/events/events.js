import { callbacks } from '../../../callbacks';
import { Users, Rooms } from '../../../models';
import { searchProviderService } from '../service/providerService';
import SearchLogger from '../logger/logger';

class EventService {

	/* eslint no-unused-vars: [2, { "args": "none" }]*/
	_pushError(name, value, payload) {
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
callbacks.add('afterSaveMessage', function(m) {
	eventService.promoteEvent('message.save', m._id, m);
});

callbacks.add('afterDeleteMessage', function(m) {
	eventService.promoteEvent('message.delete', m._id);
});

/**
 * Listen to user and room changes via cursor
 */


Users.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const user = data || Users.findOneById(id);
			eventService.promoteEvent('user.save', id, user);
			break;

		case 'removed':
			eventService.promoteEvent('user.delete', id);
			break;
	}
});

Rooms.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const room = data || Rooms.findOneById(id);
			eventService.promoteEvent('room.save', id, room);
			break;

		case 'removed':
			eventService.promoteEvent('room.delete', id);
			break;
	}
});
