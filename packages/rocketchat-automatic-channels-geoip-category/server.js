import satelize from 'satelize';

export const getCountry = function(user) {
	let countryNname;
	const ipAddress = user.connection.httpHeaders['x-forwarded-for'].split(',');
	satelize.satelize({ip: ipAddress[0] }, function(err, payload) {
		if (err || !payload) {
			countryNname = null;
		} else {
			countryNname = payload.country.en;
		}
	});
	if (!countryNname) {
		countryNname = null;
	}

	return countryNname;
};
