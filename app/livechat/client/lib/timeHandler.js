import moment from 'moment';

/**
 *	Check if given daterange matches any of pre-defined options
 * @param {String} value
 * @param {Date} from
 * @param {Date} to
 *
 * @returns {String} new value
 */
export const checkDaterangeValue = (value, from, to) => {
	if (moment().startOf('day').isSame(from) && moment().startOf('day').isSame(to)) {
		return 'today';
	}
	if (moment().startOf('day').subtract(1, 'days').isSame(from) && moment().startOf('day').subtract(1, 'days').isSame(to)) {
		return 'yesterday';
	}
	if (moment().startOf('week').isSame(from) && moment().endOf('week').isSame(to)) {
		return 'this-week';
	}
	if (moment().subtract(1, 'weeks').startOf('week').isSame(from) && moment().subtract(1, 'weeks').endOf('week').isSame(to)) {
		return 'prev-week';
	}
	if (moment().startOf('month').isSame(from) && moment().endOf('month').isSame(to)) {
		return 'this-month';
	}
	if (moment().subtract(1, 'months').startOf('month').isSame(from) && moment().subtract(1, 'months').endOf('month').isSame(to)) {
		return 'prev-month';
	}
	return value;
};

export const setTimeRange = (value, from, to) => {
	if (value && from && to) {
		const timeFilter = ['last-thirty-minutes', 'last-hour', 'last-six-hour', 'last-twelve-hour'];
		if (timeFilter.includes(value)) {
			return {
				value,
				from: moment(from).format('Do, hh:mm a'),
				to: moment(to).format('Do, hh:mm a'),
				btw: 'to',
			};
		}
		value = checkDaterangeValue(value, from, to);

		return {
			value,
			from: moment(from).format('MMM D YYYY'),
			to: moment(to).format('MMM D YYYY'),
		};
	}
	return {
		value: 'this-week',
		from: moment().startOf('week').format('MMM D YYYY'),
		to: moment().endOf('week').format('MMM D YYYY'),
	};
};
