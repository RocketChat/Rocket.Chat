import moment from 'moment';

export const convertEphemeralTime = function(time, curr) {
	const now = curr || new Date();
	switch (time) {
		case '5mins':
			time = moment(now).add(5, 'minutes').toDate();
			break;
		case '15mins':
			time = moment(now).add(15, 'minutes').toDate();
			break;
		case '1hr':
			time = moment(now).add(1, 'hour').toDate();
			break;
		case '6hr':
			time = moment(now).add(6, 'hour').toDate();
			break;
		case '12hr':
			time = moment(now).add(12, 'hour').toDate();
			break;
		case '24hr':
			time = moment(now).add(24, 'hour').toDate();
			break;
	}
	return time;
};
