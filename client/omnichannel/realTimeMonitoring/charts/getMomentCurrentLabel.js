
import { getDate, getDateWithFormat } from '../../../../lib/rocketchat-dates';

export const getMomentCurrentLabel = () => {
	const hour = getDateWithFormat(getDate(new Date()), 'H');

	return `${ getDateWithFormat(getDate(hour, ['H']), 'hA') }-${ getDateWithFormat(getDate((parseInt(hour) + 1) % 24, ['H']), 'hA') }`;
};
