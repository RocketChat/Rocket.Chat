import moment from 'moment';

export const getMomentCurrentLabel = () => {
	const numberHour = moment(new Date(), ['H']).hour();

	return `${moment(numberHour, ['H']).format('hA')}-${moment((numberHour + 1) % 24, ['H']).format('hA')}`;
};
