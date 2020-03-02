import moment from 'moment';

export const convertDateToInt = (date) => parseInt(moment(date).clone().format('YYYYMMDD'));
export const convertIntToDate = (intValue) => moment(intValue, 'YYYYMMDD').clone().toDate();
export const diffBetweenDays = (start, end) => moment(new Date(start)).clone().diff(new Date(end), 'days');
export const diffBetweenDaysInclusive = (start, end) => diffBetweenDays(start, end) + 1;

export const fillDateArrayWithEmptyDaysIfNeeded = (itemsFromDB, daysBetweenDates, endDate, label) => {
	if (itemsFromDB.length === daysBetweenDates) {
		return itemsFromDB;
	}
	const daysFound = itemsFromDB.map((day) => day._id);
	const items = itemsFromDB;
	let currentDay = moment(endDate);
	for (let index = 0; index < daysBetweenDates; index++) {
		const newId = convertDateToInt(currentDay);
		currentDay = currentDay.clone().subtract(1, 'days');
		if (!daysFound.includes(newId)) {
			items.push({ _id: newId, [label]: 0 });
		}
	}
	return items.sort((a, b) => b._id - a._id);
};

export const getTotalOfWeekItems = (weekItems, property) => weekItems.reduce((acc, item) => {
	acc += item[property];
	return acc;
}, 0);
