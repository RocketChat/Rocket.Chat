Meteor.startup(function() {
	RocketChat.settings.addGroup('Video Conference', function() {

		this.section('Jitsi', function () {
			this.add('Jitsi_Domain', 'meet.jit.si', {
				type: 'string',
				enableQuery: {
					_id: 'VideoConference_Provider',
					value: 'Jitsi'
				},
				i18nLabel: 'Domain',
				public: true
			});

			this.add('Jitsi_URL_Room_Prefix', 'RocketChat', {
				type: 'string',
				enableQuery: {
					_id: 'VideoConference_Provider',
					value: 'Jitsi'
				},
				i18nLabel: 'URL_room_prefix',
				public: true
			});

			this.add('Jitsi_SSL', true, {
				type: 'boolean',
				enableQuery: {
					_id: 'VideoConference_Provider',
					value: 'Jitsi'
				},
				i18nLabel: 'SSL',
				public: true
			});

			this.add('Jitsi_Open_New_Window', false, {
				type: 'boolean',
				enableQuery: {
					_id: 'VideoConference_Provider',
					value: 'Jitsi'
				},
				i18nLabel: 'Always_open_in_new_window',
				public: true
			});

			this.add('Jitsi_Chrome_Extension', 'nocfbnnmjnndkbipkabodnheejiegccf', {
				type: 'string',
				enableQuery: {
					_id: 'VideoConference_Provider',
					value: 'Jitsi'
				},
				i18nLabel: 'Jitsi_Chrome_Extension',
				public: true
			});
		});
	});
});
