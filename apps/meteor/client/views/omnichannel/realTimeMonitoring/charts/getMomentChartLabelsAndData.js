import moment from 'moment';

export const getMomentChartLabelsAndData = () => {
	const timingLabels = [];
	const initData = [];
	const today = moment().startOf('day');
	for (let m = today; m.diff(moment(), 'hours') < 0; m.add(1, 'hours')) {
		const numberHour = moment(new Date(), ['H']).hour();
		timingLabels.push(`${moment(numberHour, ['H']).format('hA')}-${moment((numberHour + 1) % 24, ['H']).format('hA')}`);
		initData.push(0);
	}

	return [timingLabels, initData];
};
