Meteor.startup(function() {
	return Tracker.autorun(function() {
		if (RocketChat.settings.get('Enable_Subgroups')) {
			RocketChat.TabBar.addButton({
				groups: ['channel', 'group'],
				id: 'subGroups',
				i18nTitle: 'Create_Subgroup',
				icon: 'queue',
				template: 'subGroups',
				order: 3,
				subGroups: true
			});
		} else {
			RocketChat.TabBar.removeButton('subGroups');
		}
	});
});
