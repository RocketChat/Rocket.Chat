Meteor.startup(() => {
	RocketChat.settings.addGroup('Assistify', function() {

		this.add('Assistify_Show_Standard_Features', false, {
			i18nLabel: 'Assistify_Show_Standard_Features',
			type: 'boolean',
			public: true
		});

	});
});
