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
const cursor = Meteor.users.find({}, {fields: {name:1, username:1, emails:1, active:1}});
cursor.observeChanges({
	added: (id) => {
		eventService.promoteEvent('user.save', id, Meteor.users.findOne(id));
	},
	changed: (id) => {
		eventService.promoteEvent('user.save', id, Meteor.users.findOne(id));
	},
	removed: (id) => {
		eventService.promoteEvent('user.delete', id);
	}
});

const cursor2 = RocketChat.models.Rooms.find({t:{$ne:'d'}}, {fields:{name:1, announcement:1, description:1, topic:1}});
cursor2.observeChanges({
	added: (id) => {
		eventService.promoteEvent('room.save', id, RocketChat.models.Rooms.findOneByIdOrName(id));
	},
	changed: (id) => {
		eventService.promoteEvent('room.save', id, RocketChat.models.Rooms.findOneByIdOrName(id));
	},
	removed: (id) => {
		eventService.promoteEvent('room.delete', id);
	}
});
