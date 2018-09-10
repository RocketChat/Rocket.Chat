import { setSettings } from 'meteor/rocketchat:mailer';


Meteor.startup(() => {
	setSettings(RocketChat.settings);
});
