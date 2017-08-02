RocketChat.settings.addGroup('Automatic Channels Settings', function() {
	this.section('language', function() {
		this.add('Enable_Language', false, {
			type: 'boolean'
		});
		this.add('Blacklist_Language', false, {
			type: 'boolean'
		});
	});
	this.section('Country', function() {
		this.add('Enable_GeoIp', false, {
			type: 'boolean'
		});
		this.add('Blacklist_GeoIp', false, {
			type: 'boolean'
		});
	});
});
