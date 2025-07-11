import type { SelectOption } from '@rocket.chat/fuselage';
import { Select } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subMinutes, format } from 'date-fns';
import { useState, type ComponentProps } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { DateTimeModalFormData } from './DateTimeModal';
import { DateTimeModal } from './DateTimeModal';
import { useAppLogsFilterFormContext } from '../useAppLogsFilterForm';

type DateRange = {
	start: Date;
	end: Date;
};

type DateRangeAction = 'all' | 'today' | 'last5Minutes' | 'last15Minutes' | 'last30Minutes' | 'last1Hour' | 'thisWeek' | 'custom';

type TimeFilterSelectProps = { compactView?: boolean } & Omit<ComponentProps<typeof Select>, 'onChange' | 'options'>;

export const TimeFilterSelect = ({ compactView = false, ...props }: TimeFilterSelectProps) => {
	const { setValue, control, getValues } = useAppLogsFilterFormContext();
	const { t } = useTranslation();

	const setModal = useSetModal();

	const [customTimeRangeLabel, setCustomTimeRangeOptionLabel] = useState<string>(t('Custom_time_range'));

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
			setCustomTimeRangeOptionLabel(t('Custom_time_range'));
			setModal(null);
			return;
		}

		setValue('startDate', startDate);
		setValue('startTime', startTime || '00:00');
		setValue('endDate', endDate);
		setValue('endTime', endTime || '00:00');

		const startIso = new Date(`${startDate}T${startTime || '00:00'}${getTimeZoneOffset()}`);
		const endIso = new Date(`${endDate}T${endTime || '00:00'}${getTimeZoneOffset()}`);
		const formattedStartDate = format(new Date(startIso), 'MMM dd, yyyy');
		const formattedEndDate = format(new Date(endIso), 'MMM dd, yyyy');

		setCustomTimeRangeOptionLabel(
			`${formattedStartDate}${startTime && startTime !== '00:00' ? `, ${startTime}` : ''} - ${formattedEndDate}${endTime && endTime !== '00:00' ? `, ${endTime}` : ''}`,
		);

		setModal(null);
	};

	const onModalClose = (): void => {
		setValue('timeFilter', 'all');
		setCustomTimeRangeOptionLabel(t('Custom_time_range'));
		setModal(null);
	};

	const handleChange = (action: DateRangeAction): void => {
		setValue('timeFilter', action);
		if (action === 'all') {
			setValue('startTime', undefined);
			setValue('startDate', undefined);
			setValue('endTime', undefined);
			setValue('endDate', undefined);
			return;
		}

		if (action === 'custom') {
			const { startDate = '', startTime = '00:00', endDate = '', endTime = '00:00' } = getValues();
			// Doing this since the modal is not in the form context, and it is simpler just to pass the default values to a new useForm call
			setModal(<DateTimeModal onSave={onModalSave} onClose={onModalClose} defaultValues={{ startDate, startTime, endDate, endTime }} />);
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
		...(compactView ? [] : [['custom', customTimeRangeLabel]]),
	] as SelectOption[];

	return (
		<Controller
			control={control}
			name='timeFilter'
			render={({ field }) => <Select {...props} {...field} onChange={(val) => handleChange(val as DateRangeAction)} options={options} />}
		/>
	);
};
