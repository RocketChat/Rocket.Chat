export { callWithErrorHandling as call } from '../../../../client/lib/utils/callWithErrorHandling';

export const convertDate = (date: string) => {
	const [y, m, d] = date.split('-');
	return new Date(Number(y), Number(m) - 1, Number(d));
};

export const scrollTo = (element: HTMLElement, to: number, duration = 0) => {
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
