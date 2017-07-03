const satelize = Npm.require('satelize');

get_country = function(country_header) {
	let country_name;
	satelize.satelize({ip: country_header}, function(err, payload) {
		if (err) {
			country_name = null;
		} else {
			country_name = payload.country.en;
		}
	});
	if (!country_name) {
		country_name = null;
	}

	plugin_handler.plugins.push({
		channelType: 'country',
		channelName: country_name
	});
};

