import moment from 'moment';

export const setTimeRange = (value, from, to) => {
	if (value && from && to) {
		return {
			value,
			from: moment(from).format('Do, hh:mm a'),
			to: moment(to).format('Do, hh:mm a'),
			btw: 'to',
		};
	}
	return {
		value: 'none',
		from: 'None',
		to: '',
		btw: '',
	};
};
