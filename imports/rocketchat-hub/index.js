import hub from './src';
import { RocketChat } from 'meteor/rocketchat:lib';

export default hub({
	Users: RocketChat.models.Users.model.rawCollection(),
	Trash: RocketChat.models.Trash.rawCollection(),
	Messages: RocketChat.models.Messages.model.rawCollection(),
	Subscriptions: RocketChat.models.Subscriptions.model.rawCollection(),
	Rooms: RocketChat.models.Rooms.model.rawCollection(),
	Settings: RocketChat.models.Settings.model.rawCollection(),
});
