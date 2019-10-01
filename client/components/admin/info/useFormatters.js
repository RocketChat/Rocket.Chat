import moment from 'moment';
import s from 'underscore.string';

export const useFormatters = (t) => {
	const formatNumber = (number) => s.numberFormat(number, 2);

	const formatMemorySize = (memorySize) => {
		if (typeof memorySize !== 'number') {
			return null;
		}

		const units = ['bytes', 'kB', 'MB', 'GB'];

		let order;
		for (order = 0; order < units.length - 1; ++order) {
			const upperLimit = Math.pow(1024, order + 1);

			if (memorySize < upperLimit) {
				break;
			}
		}

		const divider = Math.pow(1024, order);
		const decimalDigits = order === 0 ? 0 : 2;
		return `${ s.numberFormat(memorySize / divider, decimalDigits) } ${ units[order] }`;
	};

	const formatDate = (date) => {
		if (!date) {
			return null;
		}

		return moment(date).format('LLL');
	};

	const formatHumanReadableTime = (time) => {
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

	const formatCPULoad = (load) => {
		if (!load) {
			return null;
		}

		const [oneMinute, fiveMinutes, fifteenMinutes] = load;

		return `${ formatNumber(oneMinute) }, ${ formatNumber(fiveMinutes) }, ${ formatNumber(fifteenMinutes) }`;
	};

	return {
		formatNumber,
		formatMemorySize,
		formatDate,
		formatHumanReadableTime,
		formatCPULoad,
	};
};
