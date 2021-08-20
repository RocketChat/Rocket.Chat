import moment from 'moment';


export const convertEphemeralTime = function(time: '5mins' | '15mins' | '1hr' | '6hr' | '12hr' | '24hr', curr: string): Date {
	const now = curr || new Date();

	let ephemeralTime = moment(now).subtract(30, 'seconds').toDate();
	switch (time) {
		case '5mins':
			ephemeralTime = moment(ephemeralTime).add(5, 'minutes').toDate();
			break;
		case '15mins':
			ephemeralTime = moment(ephemeralTime).add(15, 'minutes').toDate();
			break;
		case '1hr':
			ephemeralTime = moment(ephemeralTime).add(1, 'hour').toDate();
			break;
		case '6hr':
			ephemeralTime = moment(ephemeralTime).add(6, 'hour').toDate();
			break;
		case '12hr':
			ephemeralTime = moment(ephemeralTime).add(12, 'hour').toDate();
			break;
		default:
			ephemeralTime = moment(ephemeralTime).add(24, 'hour').toDate();
			break;
	}

	return ephemeralTime;
};
