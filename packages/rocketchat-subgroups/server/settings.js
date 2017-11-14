RocketChat.settings.addGroup('General', function() {
	this.section('Subgroups', function() {
		this.add('Enable_Subgroups', false, { type: 'boolean', public: true });
	});
});