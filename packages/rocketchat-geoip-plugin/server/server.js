import {plugin_handler} from 'meteor/rocketchat:plugin-handler';

import satelize from 'satelize';

const getCountry = function(user) {
	let country_name;
	satelize.satelize({ip: user.connection.httpHeaders['x-forwarded-for'] }, function(err, payload) {
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
	enable: RocketChat.settings.get('Enable_GeoIp'),
	blacklistAllowed: RocketChat.settings.get('Blacklist_GeoIp')
});

