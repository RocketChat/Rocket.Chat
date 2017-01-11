RocketChat.settings.addGroup('General', function() {
	this.section('REST API', function() {
		this.add('API_Upper_Count_Limit', 100, { type: 'int', public: false });
		this.add('API_Default_Count', 50, { type: 'int', public: false });
		this.add('API_Allow_Infinite_Count', true, { type: 'boolean', public: false });
	});
});
