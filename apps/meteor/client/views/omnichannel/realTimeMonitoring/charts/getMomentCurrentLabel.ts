import moment from 'moment-timezone';

export const getMomentCurrentLabel = (timestamp = Date.now()) => {
	const m = moment(timestamp);
	const n = moment(m).add(1, 'hours');

	return `${m.format('hA')}-${n.format('hA')}`;
};
