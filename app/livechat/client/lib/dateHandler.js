import {
	getDateEnd,
	getDateStart,
	getDate,
	checkDateIsSame,
	checkDateIsAfter,
	addDate,
	subtractDate,
	getDateWithFormat,
} from '../../../../lib/rocketchat-dates';
import { handleError } from '../../../utils';


/**
 *	Check if given daterange matches any of pre-defined options
 * @param {String} value
 * @param {Date} from
 * @param {Date} to
 *
 * @returns {String} new value
 */
export const checkDaterangeValue = (value, from, to) => {
	if (checkDateIsSame(getDateStart(getDate(), 'day'), from) && checkDateIsSame(getDateStart(getDate(), 'day'), to)) {
		return 'today';
	}
	if (checkDateIsSame(subtractDate(getDateStart(getDate(), 'day'), 1, 'days'), from) && checkDateIsSame(subtractDate(getDateStart(getDate(), 'day'), 1, 'days'), to)) {
		return 'yesterday';
	}
	if (checkDateIsSame(getDateStart(getDate(), 'week'), from) && checkDateIsSame(getDateEnd(getDate(), 'week'), to)) {
		return 'this-week';
	}
	if (checkDateIsSame(getDateStart(subtractDate(getDate(), 1, 'weeks'), 'week'), from) && checkDateIsSame(getDateEnd(subtractDate(getDate(), 1, 'weeks'), 'week'), to)) {
		return 'prev-week';
	}
	if (checkDateIsSame(getDateStart(getDate(), 'month'), from) && checkDateIsSame(getDateEnd(getDate(), 'month'), to)) {
		return 'this-month';
	}
	if (checkDateIsSame(getDateStart(subtractDate(getDate(), 1, 'months'), 'month'), from) && checkDateIsSame(getDateEnd(subtractDate(getDate(), 1, 'months'), 'month'), to)) {
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
	if (checkDateIsAfter(getDate(from), getDate())) {
		return handleError({ details: { errorTitle: 'Invalid_dates' }, error: 'Start_date_incorrect' });
	}

	if (value && from && to) {
		value = checkDaterangeValue(value, from, to);

		return {
			value,
			from: getDateWithFormat(getDate(from), 'MMM D YYYY'),
			to: getDateWithFormat(getDate(to), 'MMM D YYYY'),
		};
	}
	return {
		value: 'this-week',
		from: getDateWithFormat(getDateStart(getDate(), 'week'), 'MMM D YYYY'),
		to: getDateWithFormat(getDateEnd(getDate(), 'week'), 'MMM D YYYY'),
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
				return setDateRange('day',
					getDateStart(addDate(getDate(currentDaterange.from, 'MMM D YYYY'), 1, 'days'), 'day'),
					getDateStart(addDate(getDate(currentDaterange.to, 'MMM D YYYY'), 1, 'days'), 'day'));
			}
			return setDateRange('day',
				getDateStart(subtractDate(getDate(currentDaterange.from, 'MMM D YYYY'), 1, 'days'), 'day'),
				getDateStart(subtractDate(getDate(currentDaterange.to, 'MMM D YYYY'), 1, 'days'), 'day'));
			// break;
		case 'this-week':
		case 'prev-week':
		case 'week':
			if (order === 1) {
				return setDateRange('week',
					getDateStart(addDate(getDate(currentDaterange.from, 'MMM D YYYY'), 1, 'weeks'), 'week'),
					getDateEnd(addDate(getDate(currentDaterange.to, 'MMM D YYYY'), 1, 'weeks'), 'week'));
			}
			return setDateRange('week',
				getDateStart(subtractDate(getDate(currentDaterange.from, 'MMM D YYYY'), 1, 'weeks'), 'week'),
				getDateEnd(subtractDate(getDate(currentDaterange.to, 'MMM D YYYY'), 1, 'weeks'), 'week'));
			// break;
		case 'this-month':
		case 'prev-month':
		case 'month':
			if (order === 1) {
				return setDateRange('month',
					getDateStart(addDate(getDate(currentDaterange.from, 'MMM D YYYY'), 1, 'months'), 'month'),
					getDateEnd(addDate(getDate(currentDaterange.to, 'MMM D YYYY'), 1, 'months'), 'month'));
			}
			return setDateRange('month',
				getDateStart(subtractDate(getDate(currentDaterange.from, 'MMM D YYYY'), 1, 'months'), 'month'),
				getDateEnd(subtractDate(getDate(currentDaterange.to, 'MMM D YYYY'), 1, 'months'), 'month'));
			// break;
		case 'custom':
			handleError({ details: { errorTitle: 'Navigation_didnot_work' }, error: 'You_have_selected_custom_dates' });
	}
};
