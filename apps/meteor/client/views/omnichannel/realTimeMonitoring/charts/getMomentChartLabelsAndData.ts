import { addHours } from 'date-fns/addHours';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';

export const getMomentChartLabelsAndData = (timestamp = Date.now()) => {
	const timingLabels: string[] = [];
	const initData: number[] = [];
	const now = new Date(timestamp);
	let m = startOfDay(timestamp);

	while (m < now) {
		const n = addHours(m, 1);
		timingLabels.push(`${format(m, 'ha')}-${format(n, 'ha')}`);
		initData.push(0);
		m = n;
	}

	return [timingLabels, initData] as const;
};
