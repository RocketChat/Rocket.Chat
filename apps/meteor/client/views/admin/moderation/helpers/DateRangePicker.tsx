import { Select, Box, type SelectOption } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment, { type Moment } from 'moment';
import React, { useMemo, useEffect } from 'react';

type DateRangePickerProps = {
	onChange(range: { start: string; end: string }): void;
};

const formatToDateInput = (date: Moment) => date.locale('en').format('YYYY-MM-DD');

const todayDate = formatToDateInput(moment());

const getMonthRange = (monthsToSubtractFromToday: number) => ({
	start: formatToDateInput(moment().subtract(monthsToSubtractFromToday, 'month').date(1)),
	end: formatToDateInput(monthsToSubtractFromToday === 0 ? moment() : moment().subtract(monthsToSubtractFromToday).date(0)),
});

const getWeekRange = (daysToSubtractFromStart: number, daysToSubtractFromEnd: number) => ({
	start: formatToDateInput(moment().subtract(daysToSubtractFromStart, 'day')),
	end: formatToDateInput(moment().subtract(daysToSubtractFromEnd, 'day')),
});

const DateRangePicker = ({ onChange }: DateRangePickerProps) => {
	const t = useTranslation();

	const handleRange = useMutableCallback((range) => {
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

	useEffect(() => {
		handleRange({
			start: formatToDateInput(moment(0)),
			end: todayDate,
		});
	}, [handleRange]);

	const handleOptionClick = useMutableCallback((action) => {
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
					start: formatToDateInput(moment(0)),
					end: todayDate,
				});
				break;
			default:
				break;
		}
	});

	return (
		<Box flexGrow={0}>
			<Select defaultSelectedKey='alldates' width='100%' options={timeOptions} onChange={handleOptionClick} />
		</Box>
	);
};

export default DateRangePicker;
