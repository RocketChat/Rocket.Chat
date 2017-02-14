Meteor.startup(function () {
	RocketChat.settings.addGroup('Reisebuddy');

	RocketChat.settings.add('Reisebuddy_active', true, {
		type: 'boolean',
		group: 'Reisebuddy',
		section: 'General',
		'public': true,
		i18nLabel: 'Reisebuddy_active'
	});
});
