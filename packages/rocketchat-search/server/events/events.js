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

RocketChat.models.Users.on('changed', (type, user)=>{
	if (type === 'inserted' || type === 'updated') {
		eventService.promoteEvent('user.save', user._id, user);
	}
	if (type === 'removed') {
		eventService.promoteEvent('user.delete', user._id);
	}
});

RocketChat.models.Rooms.on('changed', (type, room)=>{
	if (type === 'inserted' || type === 'updated') {
		eventService.promoteEvent('room.save', room._id, room);
	}
	if (type === 'removed') {
		eventService.promoteEvent('room.delete', room._id);
	}
});
