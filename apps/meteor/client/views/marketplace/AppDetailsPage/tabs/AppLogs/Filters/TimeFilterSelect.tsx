import type { SelectOption } from '@rocket.chat/fuselage';
import { Select } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { endOfDay } from 'date-fns/endOfDay';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfWeek } from 'date-fns/startOfWeek';
import { subMinutes } from 'date-fns/subMinutes';
import type { ComponentProps } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { DateTimeModalFormData } from './DateTimeModal';
import { DateTimeModal } from './DateTimeModal';
import { useAppLogsFilterFormContext } from '../useAppLogsFilterForm';

type DateRange = {
	start: Date;
	end: Date;
};

type DateRangeAction =
	'all' | 'today' | 'last5Minutes' | 'last15Minutes' | 'last30Minutes' | 'last1Hour' | 'thisWeek' | 'custom' | 'pickCustomRange';

export type TimeFilterSelectProps = { compactView?: boolean } & Omit<ComponentProps<typeof Select>, 'onChange' | 'options'>;

export const TimeFilterSelect = ({ compactView = false, ...props }: TimeFilterSelectProps) => {
	const { setValue, control, getValues } = useAppLogsFilterFormContext();
	const { t } = useTranslation();

	const setModal = useSetModal();

	const [timeFilter, startDate, startTime, endDate, endTime] = useWatch({
		control,
		name: ['timeFilter', 'startDate', 'startTime', 'endDate', 'endTime'],
	});

	const getTimeZoneOffset = (): string => {
		const offset = new Date().getTimezoneOffset();
		const absOffset = Math.abs(offset);
		return `${offset < 0 ? '+' : '-'}${`00${Math.floor(absOffset / 60)}`.slice(-2)}:${`00${absOffset % 60}`.slice(-2)}`;
	};

	const dateRangeReducer = (action: DateRangeAction): DateRange | undefined => {
		const now = new Date();
		switch (action) {
			case 'today': {
				return {
					start: startOfDay(now),
					end: endOfDay(now),
				};
			}
			case 'last5Minutes': {
				return {
					start: subMinutes(now, 5),
					end: now,
				};
			}
			case 'last15Minutes': {
				return {
					start: subMinutes(now, 15),
					end: now,
				};
			}
			case 'last30Minutes': {
				return {
					start: subMinutes(now, 30),
					end: now,
				};
			}
			case 'last1Hour': {
				return {
					start: subMinutes(now, 60),
					end: now,
				};
			}
			case 'thisWeek': {
				return {
					start: startOfWeek(now),
					end: endOfWeek(now),
				};
			}
		}
	};

	const onModalSave = (values: DateTimeModalFormData): void => {
		const { startDate, startTime, endDate, endTime } = values;

		if (!startDate || !endDate) {
			setModal(null);
			return;
		}

		const range = { startDate, startTime: startTime || '00:00', endDate, endTime: endTime || '00:00' };
		setValue('lastCustomRange', range);
		setValue('timeFilter', 'custom');
		setValue('startDate', range.startDate);
		setValue('startTime', range.startTime);
		setValue('endDate', range.endDate);
		setValue('endTime', range.endTime);
		setModal(null);
	};

	const getCustomTimeRangeLabel = (): string => {
		const startIso = new Date(`${startDate}T${startTime || '00:00'}${getTimeZoneOffset()}`);
		const endIso = new Date(`${endDate}T${endTime || '00:00'}${getTimeZoneOffset()}`);
		const formattedStartDate = format(startIso, 'MMM dd, yyyy');
		const formattedEndDate = format(endIso, 'MMM dd, yyyy');

		return `${formattedStartDate}${startTime && startTime !== '00:00' ? `, ${startTime}` : ''} - ${formattedEndDate}${endTime && endTime !== '00:00' ? `, ${endTime}` : ''}`;
	};

	const handleChange = (action: DateRangeAction): void => {
		if (action === 'pickCustomRange') {
			const { startDate = '', startTime = '00:00', endDate = '', endTime = '00:00' } = getValues('lastCustomRange') ?? {};
			setModal(
				<DateTimeModal onSave={onModalSave} onClose={() => setModal(null)} defaultValues={{ startDate, startTime, endDate, endTime }} />,
			);
			return;
		}

		setValue('timeFilter', action);
		if (action === 'all') {
			setValue('startTime', undefined);
			setValue('startDate', undefined);
			setValue('endTime', undefined);
			setValue('endDate', undefined);
			return;
		}

		const newRange = dateRangeReducer(action);
		if (newRange?.start) {
			setValue('startTime', format(newRange?.start, 'HH:mm'));
			setValue('startDate', format(newRange?.start, 'yyyy-MM-dd'));
		}

		if (newRange?.end) {
			setValue('endTime', format(newRange?.end, 'HH:mm'));
			setValue('endDate', format(newRange?.end, 'yyyy-MM-dd'));
		}
	};

	const options = [
		['all', t('All_time'), true],
		['today', t('Today')],
		['last5Minutes', t('Last_5_minutes')],
		['last15Minutes', t('Last_15_minutes')],
		['last30Minutes', t('Last_30_minutes')],
		['last1Hour', t('Last_1_hour')],
		['thisWeek', t('This_week')],
		...(timeFilter === 'custom' && startDate && endDate ? [['custom', getCustomTimeRangeLabel()]] : []),
		...(compactView ? [] : [['pickCustomRange', t('Custom_time_range')]]),
	] as SelectOption[];

	return (
		<Controller
			control={control}
			name='timeFilter'
			render={({ field }) => <Select {...props} {...field} onChange={(val) => handleChange(val as DateRangeAction)} options={options} />}
		/>
	);
};
