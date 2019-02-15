import { settings } from 'meteor/rocketchat:settings';

settings.addGroup('Webdav Integration', function() {
	this.add('Webdav_Integration_Enabled', false, {
		type: 'boolean',
		public: true,
	});
});
