import { Box, InputBox, Menu, Margins, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Moment } from 'moment';
import moment from 'moment';
import type { ComponentProps } from 'react';
import React, { useState, useMemo, useEffect } from 'react';

type DateRangePickerProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
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

const DateRangePicker = ({ onChange = () => undefined, ...props }: DateRangePickerProps) => {
	const t = useTranslation();
	const [range, setRange] = useState({ start: '', end: '' });

	const { start, end } = range;

	const handleStart = useMutableCallback(({ currentTarget }) => {
		const rangeObj = {
			start: currentTarget.value,
			end: range.end,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleEnd = useMutableCallback(({ currentTarget }) => {
		const rangeObj = {
			end: currentTarget.value,
			start: range.start,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleRange = useMutableCallback((range) => {
		setRange(range);
		onChange(range);
	});

	useEffect(() => {
		handleRange({
			start: formatToDateInput(moment().subtract(1, 'month')),
			end: todayDate,
		});
	}, [handleRange]);

	const options = useMemo(
		() => ({
			today: {
				icon: 'history',
				label: t('Today'),
				action: () => {
					handleRange(getWeekRange(0, 0));
				},
			},
			yesterday: {
				icon: 'history',
				label: t('Yesterday'),
				action: () => {
					handleRange(getWeekRange(1, 1));
				},
			},
			thisWeek: {
				icon: 'history',
				label: t('This_week'),
				action: () => {
					handleRange(getWeekRange(7, 0));
				},
			},
			previousWeek: {
				icon: 'history',
				label: t('Previous_week'),
				action: () => {
					handleRange(getWeekRange(14, 7));
				},
			},
			thisMonth: {
				icon: 'history',
				label: t('This_month'),
				action: () => {
					handleRange(getMonthRange(0));
				},
			},
			lastMonth: {
				icon: 'history',
				label: t('Previous_month'),
				action: () => {
					handleRange(getMonthRange(1));
				},
			},
		}),
		[handleRange, t],
	);

	return (
		<Box marginInline={-4} {...props}>
			<Margins inline={4}>
				<InputBox type='date' value={start} max={todayDate} flexGrow={1} height={20} onChange={handleStart} />
				<InputBox type='date' min={start} value={end} max={todayDate} flexGrow={1} height={20} onChange={handleEnd} />
				<Menu
					options={options}
					renderItem={(props: ComponentProps<typeof Option>) => <Option icon='history' {...props} />}
					alignSelf='center'
				/>
			</Margins>
		</Box>
	);
};

export default DateRangePicker;
