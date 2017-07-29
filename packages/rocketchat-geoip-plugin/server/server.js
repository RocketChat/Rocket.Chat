import {plugin_handler} from 'meteor/rocketchat:plugin-handler';

import satelize from 'satelize';

const getCountry = function(user) {
	let country_name;
	const ipAddress = user.connection.httpHeaders['x-forwarded-for'].split(',');
	satelize.satelize({ip: ipAddress[0] }, function(err, payload) {
		if (err || !payload) {
			country_name = null;
		} else {
			country_name = payload.country.en;
		}
	});
	if (!country_name) {
		country_name = null;
	}

	return country_name;
};

plugin_handler.addPlugin({
	pluginName: 'country',
	getChannelName: getCountry,
	enable: 'Enable_GeoIp',
	blacklistAllowed: 'Blacklist_GeoIp'
});

