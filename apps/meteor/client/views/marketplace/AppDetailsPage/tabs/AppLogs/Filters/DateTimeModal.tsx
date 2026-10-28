import {
	Button,
	Label,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	Stack,
} from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DateTimeFilter from './DateTimeFilter';
import FilterField from './layout/FilterField';

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

export const DateTimeModal = ({ onSave, onClose, defaultValues }: DateTimeModalProps): ReactNode => {
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
		<Modal title={t('Custom_time_range')}>
			<ModalHeader>
				<ModalTitle>{t('Custom_time_range')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Stack gap='x24'>
					<FilterField inset>
						<Label htmlFor='timeFilter'>{t('Logs_from')}</Label>
						<DateTimeFilter control={control} type='start' />
					</FilterField>
					<FilterField inset>
						<Label htmlFor='timeFilter'>{t('Until')}</Label>
						<DateTimeFilter control={control} type='end' />
					</FilterField>
				</Stack>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button variant='primary' disabled={!watch('startDate') || !watch('endDate')} onClick={handleSave}>
						{t('Apply')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};
