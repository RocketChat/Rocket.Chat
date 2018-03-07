RocketChat.settings.addGroup('General', function() {
	this.section('Update', function() {
		this.add('Update_LatestAvailableVersion', '0.0.0', {
			type: 'string',
			readonly: true
		});
	});
});
