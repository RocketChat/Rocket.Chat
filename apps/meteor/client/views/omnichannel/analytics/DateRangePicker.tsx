import { Box, InputBox, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { Moment } from 'moment';
import moment from 'moment';
import type { ComponentProps, FormEvent } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

moment.locale('en');

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
	const { t } = useTranslation();
	const [range, setRange] = useState({ start: '', end: '' });

	const { start, end } = range;

	const handleStart = useEffectEvent(({ currentTarget }: FormEvent<HTMLInputElement>) => {
		const rangeObj = {
			start: currentTarget.value,
			end: range.end,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleEnd = useEffectEvent(({ currentTarget }: FormEvent<HTMLInputElement>) => {
		const rangeObj = {
			end: currentTarget.value,
			start: range.start,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleRange = useEffectEvent((range: { start: string; end: string }) => {
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
		() => [
			{
				id: 'today',
				icon: 'history' as const,
				content: t('Today'),
				onClick: () => {
					handleRange(getWeekRange(0, 0));
				},
			},
			{
				id: 'yesterday',
				icon: 'history' as const,
				content: t('Yesterday'),
				onClick: () => {
					handleRange(getWeekRange(1, 1));
				},
			},
			{
				id: 'thisWeek',
				icon: 'history' as const,
				content: t('This_week'),
				onClick: () => {
					handleRange(getWeekRange(7, 0));
				},
			},
			{
				id: 'previousWeek',
				icon: 'history' as const,
				content: t('Previous_week'),
				onClick: () => {
					handleRange(getWeekRange(14, 7));
				},
			},
			{
				id: 'thisMonth',
				icon: 'history' as const,
				content: t('This_month'),
				onClick: () => {
					handleRange(getMonthRange(0));
				},
			},
			{
				id: 'lastMonth',
				icon: 'history' as const,
				content: t('Previous_month'),
				onClick: () => {
					handleRange(getMonthRange(1));
				},
			},
		],
		[handleRange, t],
	);

	return (
		<Box {...props}>
			<Box mi='neg-x4' height='full' display='flex' flexDirection='row'>
				<Field mi={4} flexShrink={1} flexGrow={1}>
					<FieldLabel>{t('Start')}</FieldLabel>
					<FieldRow>
						<Box height='x40' display='flex' width='full'>
							<InputBox type='date' onChange={handleStart} max={todayDate} value={start} />
						</Box>
					</FieldRow>
				</Field>
				<Field mi={4} flexShrink={1} flexGrow={1}>
					<FieldLabel>{t('End')}</FieldLabel>
					<FieldRow>
						<Box height='x40' display='flex' width='full'>
							<InputBox type='date' onChange={handleEnd} min={start} max={todayDate} value={end} />
						</Box>
						<Box mis={8}>
							<GenericMenu title={t('Date_range_presets')} items={options} small />
						</Box>
					</FieldRow>
				</Field>
			</Box>
		</Box>
	);
};

export default DateRangePicker;
