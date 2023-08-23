import { Box, InputBox, Menu, Field } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Moment } from 'moment';
import moment from 'moment';
import type { ComponentProps } from 'react';
import React, { useState, useMemo, useEffect } from 'react';

type DateRangePickerProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
	onChange(range: { start: string; end: string }): void;
};

const formatToDateInput = (date: Moment) => date.format('YYYY-MM-DD');

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
			start: todayDate,
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
		<Box {...props}>
			<Box mi='neg-x4' height='full' display='flex' flexDirection='row'>
				<Field mi={4} flexShrink={1} flexGrow={1}>
					<Field.Label>{t('Start')}</Field.Label>
					<Field.Row>
						<Box height='x40' display='flex' width='full'>
							<InputBox type='date' onChange={handleStart} max={todayDate} value={start} />
						</Box>
					</Field.Row>
				</Field>
				<Field mi={4} flexShrink={1} flexGrow={1}>
					<Field.Label>{t('End')}</Field.Label>
					<Field.Row>
						<Box height='x40' display='flex' width='full'>
							<InputBox type='date' onChange={handleEnd} min={start} max={todayDate} value={end} />
						</Box>
						<Menu mis={8} options={options} />
					</Field.Row>
				</Field>
			</Box>
		</Box>
	);
};

export default DateRangePicker;
