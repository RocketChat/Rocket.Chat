import moment from 'moment';

export function timeAgo(time, t, now = new Date()) {
	if (!time) {
		return;
	}

	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	const isToday = time.getFullYear() >= today.getFullYear() && time.getMonth() >= today.getMonth() && time.getDate() >= today.getDate();
	const wasYesterday =
		time.getFullYear() >= yesterday.getFullYear() && time.getMonth() >= yesterday.getMonth() && time.getDate() >= yesterday.getDate();

	const todayFormatted = isToday && moment(time).format('LT');
	const yesterdayFormatted = wasYesterday && t('yesterday');
	const beforeFormatted = moment(time).format('MMM D, YYYY');

	return todayFormatted || yesterdayFormatted || beforeFormatted;
}
