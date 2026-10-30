import { Box, Label } from '@rocket.chat/fuselage';
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
			<Box display='flex' flexDirection='column' marginInlineEnd='x8' marginBlockEnd='x24' flexGrow={1}>
				<Label htmlFor='timeFilter'>{t('Logs_from')}</Label>
				<DateTimeFilter control={control} type='start' />
			</Box>
			<Box display='flex' flexDirection='column' marginInlineEnd='x8' flexGrow={1}>
				<Label htmlFor='timeFilter'>{t('Until')}</Label>
				<DateTimeFilter control={control} type='end' />
			</Box>
		</GenericModal>
	);
};
