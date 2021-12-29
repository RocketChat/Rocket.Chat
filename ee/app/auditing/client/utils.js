export { callWithErrorHandling as call } from '../../../../client/lib/utils/callWithErrorHandling';

export const convertDate = (date) => {
	const [y, m, d] = date.split('-');
	return new Date(y, m - 1, d);
};

export const scrollTo = function scrollTo(element, to, duration) {
	if (duration <= 0) {
		return;
	}
	const difference = to - element.scrollTop;
	const perTick = (difference / duration) * 10;

	setTimeout(function () {
		element.scrollTop += perTick;
		if (element.scrollTop === to) {
			return;
		}
		scrollTo(element, to, duration - 10);
	}, 10);
};
