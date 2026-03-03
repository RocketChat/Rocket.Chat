import { format, addHours } from 'date-fns';

export const getMomentCurrentLabel = (timestamp = Date.now()) => {
	const m = new Date(timestamp);
	const n = addHours(m, 1);

	return `${format(m, 'ha')}-${format(n, 'ha')}`;
};
