import * as Mailer from 'meteor/rocketchat:mailer';


Meteor.startup(() => {
	Mailer.setSettings(RocketChat.settings);
});
