import { Box, Button, Label, Modal } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DateTimeFilter from './DateTimeFilter';

type DateTimeModalProps = {
	onClose: () => void;
	onSave: (value: { startDate: string; startTime: string; endDate: string; endTime: string }) => void;
	confirmDisabled?: boolean;
};

export const DateTimeModal = ({ onSave, onClose }: DateTimeModalProps): ReactNode => {
	const { t } = useTranslation();

	const { control, getValues, getFieldState } = useForm();

	const handleSave = (): void => {
		onSave({
			startDate: getValues('startDate'),
			startTime: getValues('startTime'),
			endDate: getValues('endDate'),
			endTime: getValues('endTime'),
		});
	};

	return (
		<Modal title={t('Custom_time_range')}>
			<Modal.Header>
				<Modal.Title>{t('Custom_time_range')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Logs_from')}</Label>
					<DateTimeFilter control={control} type='start' />
				</Box>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Until')}</Label>
					<DateTimeFilter control={control} type='end' />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary disabled={!getFieldState('startDate').isDirty || !getFieldState('endDate').isDirty} onClick={handleSave}>
						{t('Apply')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};
