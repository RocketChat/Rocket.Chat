import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.settings.addGroup('Webdav Integration', function() {
	this.add('Webdav_Integration_Enabled', false, {
		type: 'boolean',
		public: true,
	});
});
