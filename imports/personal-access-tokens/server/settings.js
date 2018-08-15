RocketChat.settings.addGroup('General', function() {
	this.section('REST API', function() {
		this.add('API_Enable_Personal_Access_Tokens', false, { type: 'boolean', public: true });
	});
});
