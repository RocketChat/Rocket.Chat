import {searchProviderService} from '../service/providerService';
import SearchLogger from '../logger/logger';

class EventService {

	/*eslint no-unused-vars: [2, { "args": "none" }]*/
	_pushError(name, value, payload) {
		//TODO implement a (performant) cache
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
RocketChat.callbacks.add('afterSaveMessage', function(m) {
	eventService.promoteEvent('message.save', m._id, m);
});

RocketChat.callbacks.add('afterDeleteMessage', function(m) {
	eventService.promoteEvent('message.delete', m._id);
});

/**
 * Listen to user and room changes via cursor
 */


RocketChat.models.Users.on('change', ({action, id}) => {
	switch (action) {
		case 'update:record':
		case 'update:diff':
		case 'insert':
			const user = RocketChat.models.Users.findOneById(id);
			eventService.promoteEvent('user.save', id, user);
			break;

		case 'remove':
			eventService.promoteEvent('user.delete', id);
			break;
	}
});

RocketChat.models.Rooms.on('change', ({action, id}) => {
	switch (action) {
		case 'update:record':
		case 'update:diff':
		case 'insert':
			const room = RocketChat.models.Rooms.findOneById(id);
			eventService.promoteEvent('room.save', id, room);
			break;

		case 'remove':
			eventService.promoteEvent('room.delete', id);
			break;
	}
});
