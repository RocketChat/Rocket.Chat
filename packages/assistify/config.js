Meteor.startup(()=>{
	RocketChat.settings.addGroup('Assistify');

	RocketChat.settings.add('Assistify_Show_Standard_Features', false, {
		group: 'Assistify',
		i18nLabel: 'Assistify_Show_Standard_Features',
		type: 'boolean',
		public: true
	});
});
