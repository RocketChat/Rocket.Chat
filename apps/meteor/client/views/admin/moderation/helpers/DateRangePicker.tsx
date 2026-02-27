import { subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { Select, Box, type SelectOption } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Key } from 'react';
import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type DateRangePickerProps = {
	onChange(range: { start: string; end: string }): void;
	defaultSelectedKey?: 'today' | 'yesterday' | 'thisWeek' | 'previousWeek' | 'thisMonth' | 'alldates';
};

const formatToDateInput = (date: Date) => format(date, 'yyyy-MM-dd');

const getMonthRange = (monthsToSubtractFromToday: number) => {
	const now = new Date();
	const startDate = monthsToSubtractFromToday === 0 ? startOfMonth(now) : startOfMonth(subMonths(now, monthsToSubtractFromToday));
	const endDate = monthsToSubtractFromToday === 0 ? now : endOfMonth(subMonths(now, monthsToSubtractFromToday));
	return {
		start: formatToDateInput(startDate),
		end: formatToDateInput(endDate),
	};
};

const getWeekRange = (daysToSubtractFromStart: number, daysToSubtractFromEnd: number) => {
	const now = new Date();
	return {
		start: formatToDateInput(subDays(now, daysToSubtractFromStart)),
		end: formatToDateInput(subDays(now, daysToSubtractFromEnd)),
	};
};

const DateRangePicker = ({ onChange, defaultSelectedKey = 'alldates' }: DateRangePickerProps) => {
	const { t } = useTranslation();

	const handleRange = useEffectEvent((range: { start: string; end: string }) => {
		onChange(range);
	});

	const timeOptions = useMemo<SelectOption[]>(() => {
		return [
			['today', t('Today')],
			['yesterday', t('Yesterday')],
			['thisWeek', t('This_week')],
			['previousWeek', t('Previous_week')],
			['thisMonth', t('This_month')],
			['alldates', t('All')],
		].map(([value, label]) => [value, label] as SelectOption);
	}, [t]);

	const handleOptionClick = useEffectEvent((action: Key) => {
		switch (action) {
			case 'today':
				handleRange(getWeekRange(0, 0));
				break;
			case 'yesterday':
				handleRange(getWeekRange(1, 1));
				break;
			case 'thisWeek':
				handleRange(getWeekRange(7, 0));
				break;
			case 'previousWeek':
				handleRange(getWeekRange(14, 7));
				break;
			case 'thisMonth':
				handleRange(getMonthRange(0));
				break;
			case 'alldates':
				handleRange({
					start: '',
					end: '',
				});
				break;
			default:
				break;
		}
	});

	useEffect(() => {
		handleOptionClick(defaultSelectedKey);
	}, []);

	return (
		<Box flexGrow={0}>
			<Select defaultSelectedKey={defaultSelectedKey} width='100%' options={timeOptions} onChange={handleOptionClick} />
		</Box>
	);
};

export default DateRangePicker;
