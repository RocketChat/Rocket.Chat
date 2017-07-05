import satelize from 'satelize';
export function get_country(country_header) {
	let country_name;
	satelize.satelize({ip: country_header}, function(err, payload) {
		if (err || !payload) {
			country_name = null;
		} else {
			country_name = payload.country.en;
		}
	});
	if (!country_name) {
		country_name = null;
	}

	const countryResult = {
		channelType: 'country',
		channelName: country_name
	};
	return countryResult;
}

