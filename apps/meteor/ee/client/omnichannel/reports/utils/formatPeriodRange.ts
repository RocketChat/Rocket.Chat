import type { Period } from '../../../components/dashboards/periods';
import { getPeriodRange } from '../../../components/dashboards/periods';

const formatDate = (date: Date): string => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${year}-${month}-${day}`;
};

export const formatPeriodRange = (period: Period['key']): { start: string; end: string } => {
	const { start, end } = getPeriodRange(period);
	return {
		start: formatDate(start),
		end: formatDate(end),
	};
};
