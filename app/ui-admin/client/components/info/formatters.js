import moment from 'moment';
import s from 'underscore.string';

export const formatNumber = (number) => s.numberFormat(number, 2);

export const formatDate = (date) => {
	if (!date) {
		return null;
	}

	return moment(date).format('LLL');
};

export const formatHumanReadableTime = (time, t) => {
	const days = Math.floor(time / 86400);
	const hours = Math.floor((time % 86400) / 3600);
	const minutes = Math.floor(((time % 86400) % 3600) / 60);
	const seconds = Math.floor(((time % 86400) % 3600) % 60);
	let out = '';
	if (days > 0) {
		out += `${ days } ${ t('days') }, `;
	}
	if (hours > 0) {
		out += `${ hours } ${ t('hours') }, `;
	}
	if (minutes > 0) {
		out += `${ minutes } ${ t('minutes') }, `;
	}
	if (seconds > 0) {
		out += `${ seconds } ${ t('seconds') }`;
	}
	return out;
};

export const formatCPULoad = (load) => {
	if (!load) {
		return null;
	}

	const [oneMinute, fiveMinutes, fifteenMinutes] = load;

	return `${ formatNumber(oneMinute) }, ${ formatNumber(fiveMinutes) }, ${ formatNumber(fifteenMinutes) }`;
};
