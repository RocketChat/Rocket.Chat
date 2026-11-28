import { Field, FieldLabel, FieldRow, Stack } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DateTimeFilter from './DateTimeFilter';

export type DateTimeModalFormData = {
	startDate?: string;
	startTime?: string;
	endDate?: string;
	endTime?: string;
};

export type DateTimeModalProps = {
	onClose: () => void;
	onSave: (value: DateTimeModalFormData) => void;
	confirmDisabled?: boolean;
	defaultValues?: DateTimeModalFormData;
};

export const DateTimeModal = ({ onSave, onClose, defaultValues }: DateTimeModalProps) => {
	const { t } = useTranslation();

	const { control, getValues, watch } = useForm<DateTimeModalFormData>({ defaultValues });

	const handleSave = (): void => {
		onSave({
			startDate: getValues('startDate'),
			startTime: getValues('startTime'),
			endDate: getValues('endDate'),
			endTime: getValues('endTime'),
		});
	};

	return (
		<GenericModal
			icon={null}
			variant='warning'
			title={t('Custom_time_range')}
			onCancel={onClose}
			confirmDisabled={!watch('startDate') || !watch('endDate')}
			confirmText={t('Apply')}
			onConfirm={handleSave}
		>
			<Stack gap='x24'>
				<Field>
					<FieldLabel htmlFor='timeFilter'>{t('Logs_from')}</FieldLabel>
					<FieldRow>
						<DateTimeFilter control={control} type='start' />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor='timeFilter'>{t('Until')}</FieldLabel>
					<FieldRow>
						<DateTimeFilter control={control} type='end' />
					</FieldRow>
				</Field>
			</Stack>
		</GenericModal>
	);
};
