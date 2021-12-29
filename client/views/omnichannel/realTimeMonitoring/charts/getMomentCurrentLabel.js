import moment from 'moment';

export const getMomentCurrentLabel = () => {
	const hour = moment(new Date()).format('H');

	return `${moment(hour, ['H']).format('hA')}-${moment((parseInt(hour) + 1) % 24, ['H']).format('hA')}`;
};
