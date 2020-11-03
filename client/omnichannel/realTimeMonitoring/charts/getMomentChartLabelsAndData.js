import { getDate, addDate, getDateDiff, getDateWithFormat, getDateStart } from '../../../../lib/rocketchat-dates';

export const getMomentChartLabelsAndData = () => {
	const timingLabels = [];
	const initData = [];
	const today = getDateStart(getDate(), 'day');
	for (let m = today; getDateDiff(m, getDate(), 'hours') < 0; addDate(m, 1, 'hours')) {
		const hour = getDateWithFormat(m, 'H');
		timingLabels.push(`${ getDateWithFormat(getDate(hour, ['H']), 'hA') }-${ getDateWithFormat(getDate((parseInt(hour) + 1) % 24, ['H']), 'hA') }`);
		initData.push(0);
	}

	return [timingLabels, initData];
};
