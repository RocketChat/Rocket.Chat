import _ from 'underscore';
import MentionsServer from './Mentions';

const mention = new MentionsServer({
	pattern: () => RocketChat.settings.get('UTF8_Names_Validation'),
	messageMaxAll: () => RocketChat.settings.get('Message_MaxAll'),
	getUsers: (usernames) => Meteor.users.find({ username: {$in: _.unique(usernames)}}, { fields: {_id: true, username: true }}).fetch(),
	getChannel: (rid) => RocketChat.models.Rooms.findOneById(rid),
	getChannels: (channels) => RocketChat.models.Rooms.find({ name: {$in: _.unique(channels)}, t: 'c'	}, { fields: {_id: 1, name: 1 }}).fetch()
});
RocketChat.callbacks.add('beforeSaveMessage', (message) => mention.execute(message), RocketChat.callbacks.priority.HIGH, 'mentions');
