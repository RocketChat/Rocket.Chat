import hub from './index';
// Database Name


export default hub({
	Trash: RocketChat.models.Trash.rawCollection(),
	Messages: RocketChat.models.Messages.model.rawCollection(),
	Subscriptions: RocketChat.models.Subscriptions.model.rawCollection(),
	Rooms: RocketChat.models.Rooms.model.rawCollection(),
	Settings: RocketChat.models.Settings.model.rawCollection(),
});
