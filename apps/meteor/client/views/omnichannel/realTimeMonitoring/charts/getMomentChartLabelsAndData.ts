import moment from 'moment';

export const getMomentChartLabelsAndData = (timestamp = Date.now()) => {
	const timingLabels = [];
	const initData = [];
	const today = moment(timestamp).startOf('day');
	for (let m = today; m.diff(moment(timestamp), 'hours') < 0; m.add(1, 'hours')) {
		const numberHour = moment(timestamp, ['H']).hour();
		timingLabels.push(`${moment(numberHour, ['H']).format('hA')}-${moment((numberHour + 1) % 24, ['H']).format('hA')}`);
		initData.push(0);
	}

	return [timingLabels, initData];
};
