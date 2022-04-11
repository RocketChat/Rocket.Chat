import moment from 'moment';

export const getMomentChartLabelsAndData = () => {
	const timingLabels = [];
	const initData = [];
	const today = moment().startOf('day');
	for (let m = today; m.diff(moment(), 'hours') < 0; m.add(1, 'hours')) {
		const hour = m.format('H');
		timingLabels.push(`${moment(hour, ['H']).format('hA')}-${moment((parseInt(hour) + 1) % 24, ['H']).format('hA')}`);
		initData.push(0);
	}

	return [timingLabels, initData];
};
