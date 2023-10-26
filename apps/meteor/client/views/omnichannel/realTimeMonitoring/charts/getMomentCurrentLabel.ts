import moment from 'moment';

export const getMomentCurrentLabel = (timestamp = Date.now()) => {
	const numberHour = moment(timestamp, ['H']).hour();

	return `${moment(numberHour, ['H']).format('hA')}-${moment((numberHour + 1) % 24, ['H']).format('hA')}`;
};
