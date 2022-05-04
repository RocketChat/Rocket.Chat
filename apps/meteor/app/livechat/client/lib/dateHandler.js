import moment from 'moment';

import { handleError } from '../../../../client/lib/utils/handleError';

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

/**
 * Update daterange provided
 * @param {String} value
 * @param {Date} from
 * @param {Date} to
 */
export const setDateRange = (value, from, to) => {
	if (moment(from).isAfter(moment())) {
		return handleError({ details: { errorTitle: 'Invalid_dates' }, error: 'Start_date_incorrect' });
	}

	if (value && from && to) {
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

/**
 * Inc/Dec ReactiVar Daterange by one unit.
 * @param {Object} currentDaterange
 * @param {Int} order
 */
export const updateDateRange = (currentDaterange, order) => {
	// const currentDaterange = daterange.get();

	switch (currentDaterange.value) {
		case 'today':
		case 'yesterday':
		case 'day':
			if (order === 1) {
				return setDateRange(
					'day',
					moment(currentDaterange.from, 'MMM D YYYY').add(1, 'days').startOf('day'),
					moment(currentDaterange.to, 'MMM D YYYY').add(1, 'days').startOf('day'),
				);
			}
			return setDateRange(
				'day',
				moment(currentDaterange.from, 'MMM D YYYY').subtract(1, 'days').startOf('day'),
				moment(currentDaterange.to, 'MMM D YYYY').subtract(1, 'days').startOf('day'),
			);

		// break;
		case 'this-week':
		case 'prev-week':
		case 'week':
			if (order === 1) {
				return setDateRange(
					'week',
					moment(currentDaterange.from, 'MMM D YYYY').add(1, 'weeks').startOf('week'),
					moment(currentDaterange.to, 'MMM D YYYY').add(1, 'weeks').endOf('week'),
				);
			}
			return setDateRange(
				'week',
				moment(currentDaterange.from, 'MMM D YYYY').subtract(1, 'weeks').startOf('week'),
				moment(currentDaterange.to, 'MMM D YYYY').subtract(1, 'weeks').endOf('week'),
			);

		// break;
		case 'this-month':
		case 'prev-month':
		case 'month':
			if (order === 1) {
				return setDateRange(
					'month',
					moment(currentDaterange.from, 'MMM D YYYY').add(1, 'months').startOf('month'),
					moment(currentDaterange.to, 'MMM D YYYY').add(1, 'months').endOf('month'),
				);
			}
			return setDateRange(
				'month',
				moment(currentDaterange.from, 'MMM D YYYY').subtract(1, 'months').startOf('month'),
				moment(currentDaterange.to, 'MMM D YYYY').subtract(1, 'months').endOf('month'),
			);

		// break;
		case 'custom':
			handleError({
				details: { errorTitle: 'Navigation_didnot_work' },
				error: 'You_have_selected_custom_dates',
			});
	}
};
