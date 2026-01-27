import { Box, InputBox, Margins } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import moment from 'moment';
import type { ReactElement, ComponentProps, SetStateAction, FormEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { DateRange } from '../../utils/dateRange';

const formatToDateInput = (date: Date | undefined) => {
	if (!date) {
		return '';
	}

	const yearPart = date.getFullYear().toString().padStart(4, '0').slice(0, 4);
	const monthPart = (date.getMonth() + 1).toString().padStart(2, '0').slice(0, 2);
	const dayPart = date.getDate().toString().padStart(2, '0').slice(0, 2);
	return `${yearPart}-${monthPart}-${dayPart}`;
};

const parseFromStartDateInput = (date: string) => {
	if (!date) {
		return undefined;
	}

	return moment(date, 'YYYY-MM-DD').startOf('day').toDate();
};

const parseFromEndDateInput = (date: string) => {
	if (!date) {
		return undefined;
	}

	return moment(date, 'YYYY-MM-DD').endOf('day').toDate();
};

type DateRangeAction =
	| SetStateAction<DateRange>
	| 'today'
	| 'yesterday'
	| 'this-week'
	| 'last-week'
	| 'this-month'
	| 'last-month'
	| { newStart: string }
	| { newEnd: string };

const dateRangeReducer = (state: DateRange, action: DateRangeAction): DateRange => {
	switch (action) {
		case 'today': {
			return {
				start: moment().startOf('day').toDate(),
				end: moment().endOf('day').toDate(),
			};
		}

		case 'yesterday': {
			return {
				start: moment().subtract(1, 'day').startOf('day').toDate(),
				end: moment().subtract(1, 'day').endOf('day').toDate(),
			};
		}

		case 'this-week': {
			return {
				start: moment().startOf('week').toDate(),
				end: moment().endOf('day').toDate(),
			};
		}

		case 'last-week': {
			return {
				start: moment().subtract(1, 'week').startOf('week').toDate(),
				end: moment().subtract(1, 'week').endOf('week').toDate(),
			};
		}

		case 'this-month': {
			return {
				start: moment().startOf('month').toDate(),
				end: moment().endOf('day').toDate(),
			};
		}

		case 'last-month': {
			return {
				start: moment().subtract(1, 'month').startOf('month').toDate(),
				end: moment().subtract(1, 'month').endOf('month').toDate(),
			};
		}

		default:
			if (typeof action === 'object' && 'newStart' in action) {
				if (action.newStart === formatToDateInput(state.start)) {
					return state;
				}

				return { ...state, start: parseFromStartDateInput(action.newStart) };
			}

			if (typeof action === 'object' && 'newEnd' in action) {
				if (action.newEnd === formatToDateInput(state.end)) {
					return state;
				}

				return { ...state, end: parseFromEndDateInput(action.newEnd) };
			}

			const newState = typeof action === 'function' ? action(state) : action;
			return newState;
	}
};

type DateRangePickerProps = Omit<ComponentProps<typeof Box>, 'value' | 'onChange'> & {
	value?: DateRange;
	onChange?: (dateRange: DateRange) => void;
};

const DateRangePicker = ({ value, onChange, ...props }: DateRangePickerProps): ReactElement => {
	const dispatch = useEffectEvent((action: DateRangeAction): void => {
		const newRange = dateRangeReducer(value ?? { start: undefined, end: undefined }, action);
		onChange?.(newRange);
	});

	const handleChangeStart = useEffectEvent(({ currentTarget }: FormEvent<HTMLInputElement>) => {
		dispatch({ newStart: currentTarget.value });
	});

	const handleChangeEnd = useEffectEvent(({ currentTarget }: FormEvent<HTMLInputElement>) => {
		dispatch({ newEnd: currentTarget.value });
	});

	const startDate = useMemo(() => formatToDateInput(value?.start), [value?.start]);
	const endDate = useMemo(() => formatToDateInput(value?.end), [value?.end]);
	const maxStartDate = useMemo(() => {
		return formatToDateInput(value?.end ? moment.min(moment(value.end), moment()).toDate() : new Date());
	}, [value?.end]);
	const minEndDate = startDate;
	const maxEndDate = useMemo(() => formatToDateInput(new Date()), []);

	const { t } = useTranslation();

	const presets = useMemo(
		() => [
			{
				id: 'today',
				icon: 'history' as const,
				content: t('Today'),
				onClick: () => dispatch('today'),
			},
			{
				id: 'yesterday',
				icon: 'history' as const,
				content: t('Yesterday'),
				onClick: () => dispatch('yesterday'),
			},
			{
				id: 'thisWeek',
				icon: 'history' as const,
				content: t('This_week'),
				onClick: () => dispatch('this-week'),
			},
			{
				id: 'previousWeek',
				icon: 'history' as const,
				content: t('Previous_week'),
				onClick: () => dispatch('last-week'),
			},
			{
				id: 'thisMonth',
				icon: 'history' as const,
				content: t('This_month'),
				onClick: () => dispatch('this-month'),
			},
			{
				id: 'lastMonth',
				icon: 'history' as const,
				content: t('Previous_month'),
				onClick: () => dispatch('last-month'),
			},
		],
		[dispatch, t],
	);

	return (
		<Box marginInline={-4} alignItems='center' {...props}>
			<Margins inline={4}>
				<InputBox type='date' value={startDate} max={maxStartDate} flexGrow={1} height={20} onChange={handleChangeStart} />
				<InputBox type='date' min={minEndDate} value={endDate} max={maxEndDate} flexGrow={1} height={20} onChange={handleChangeEnd} />
				<GenericMenu title={t('Date_range_presets')} items={presets} small />
			</Margins>
		</Box>
	);
};

export default DateRangePicker;
