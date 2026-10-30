import { Select, Box, type SelectOption } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { endOfMonth } from 'date-fns/endOfMonth';
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subDays } from 'date-fns/subDays';
import { subMonths } from 'date-fns/subMonths';
import type { Key } from 'react';
import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type DateRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'previousWeek' | 'thisMonth' | 'alldates';

export type DateRangePickerProps = {
	onChange(range: { start: string; end: string }): void;
	defaultSelectedKey?: DateRangePreset;
	value?: DateRangePreset | null;
	onPresetChange?(preset: DateRangePreset): void;
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

const DateRangePicker = ({ onChange, defaultSelectedKey = 'alldates', value, onPresetChange }: DateRangePickerProps) => {
	const { t } = useTranslation();

	const handleRange = useStableCallback((range: { start: string; end: string }) => {
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

	const handleOptionClick = useStableCallback((action: Key) => {
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
				return;
		}
		onPresetChange?.(action);
	});

	useEffect(() => {
		handleOptionClick(defaultSelectedKey);
	}, []);

	return (
		<Box flexGrow={0}>
			<Select
				aria-label={t('Select_period')}
				placeholder={t('Custom')}
				defaultSelectedKey={defaultSelectedKey}
				value={value}
				options={timeOptions}
				onChange={handleOptionClick}
			/>
		</Box>
	);
};

export default DateRangePicker;
