import { Box, InputBox, Menu, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { useState, useMemo, useEffect } from 'react';

const date = new Date();

const formatToDateInput = (date: Date): string => date.toISOString().slice(0, 10);

const todayDate = formatToDateInput(date);

const getMonthRange = (monthsToSubtractFromToday: number): { start: string; end: string } => {
	const date = new Date();
	return {
		start: formatToDateInput(new Date(date.getFullYear(), date.getMonth() - monthsToSubtractFromToday, 1)),
		end: formatToDateInput(new Date(date.getFullYear(), date.getMonth() - monthsToSubtractFromToday + 1, 0)),
	};
};

const getWeekRange = (daysToSubtractFromStart: number, daysToSubtractFromEnd: number): { start: string; end: string } => {
	const date = new Date();
	return {
		start: formatToDateInput(new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToSubtractFromStart)),
		end: formatToDateInput(new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToSubtractFromEnd)),
	};
};

type DateRangePickerProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
	onChange?: (dateRange: { start: string; end: string }) => void;
};

const DateRangePicker = ({ onChange, ...props }: DateRangePickerProps): ReactElement => {
	const t = useTranslation();
	const [range, setRange] = useState({ start: '', end: '' });

	const { start, end } = range;

	const handleStart = useMutableCallback(({ currentTarget }) => {
		const rangeObj = {
			start: currentTarget.value,
			end: range.end,
		};
		setRange(rangeObj);
		onChange?.(rangeObj);
	});

	const handleEnd = useMutableCallback(({ currentTarget }) => {
		const rangeObj = {
			end: currentTarget.value,
			start: range.start,
		};
		setRange(rangeObj);
		onChange?.(rangeObj);
	});

	const handleRange = useMutableCallback((range) => {
		setRange(range);
		onChange?.(range);
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
				action: (): void => {
					handleRange(getWeekRange(0, 0));
				},
			},
			yesterday: {
				icon: 'history',
				label: t('Yesterday'),
				action: (): void => {
					handleRange(getWeekRange(1, 1));
				},
			},
			thisWeek: {
				icon: 'history',
				label: t('This_week'),
				action: (): void => {
					handleRange(getWeekRange(7, 0));
				},
			},
			previousWeek: {
				icon: 'history',
				label: t('Previous_week'),
				action: (): void => {
					handleRange(getWeekRange(14, 7));
				},
			},
			thisMonth: {
				icon: 'history',
				label: t('This_month'),
				action: (): void => {
					handleRange(getMonthRange(0));
				},
			},
			lastMonth: {
				icon: 'history',
				label: t('Previous_month'),
				action: (): void => {
					handleRange(getMonthRange(1));
				},
			},
		}),
		[handleRange, t],
	);

	return (
		<Box mi='neg-x4' {...props}>
			<Margins inline='x4'>
				<InputBox type='date' onChange={handleStart} max={todayDate} value={start} flexGrow={1} h='x20' />
				<InputBox type='date' onChange={handleEnd} max={todayDate} min={start} value={end} flexGrow={1} h='x20' />
				<Menu options={options} alignSelf='center' />
			</Margins>
		</Box>
	);
};

export default DateRangePicker;
