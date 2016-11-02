RocketChat.Migrations.add({
	version: 65,
	up: function() {
		RocketChat.models.Settings.update({ _id: 'Layout_Sidenav_Footer' }, {
			$set: {
				value: '<img style="left: 10px; position: absolute;" src="'+(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '')+'/assets/logo.png" />'
			}
		});
	}
});
