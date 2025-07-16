import {
	Box,
	Button,
	Field,
	FieldLabel,
	FieldRow,
	Label,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	NumberInput,
	RadioButton,
} from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AppLogsFilterFormData } from '../useAppLogsFilterForm';

type ExportLogsModalProps = {
	onClose: () => void;
	filterValues: AppLogsFilterFormData;
};

type FormDataType = {
	type: 'json' | 'csv';
	count: 'max' | 'custom';
	customExportAmount: number;
};

export const ExportLogsModal = ({ onClose, filterValues }: ExportLogsModalProps) => {
	const { t } = useTranslation();

	const appId = useRouteParameter('id');

	const {
		control,
		watch,
		getValues,
		formState: { isValid },
	} = useForm<FormDataType>({
		defaultValues: {
			type: 'json',
			count: 'max',
			customExportAmount: 100,
		},
	});

	const type = watch('type');
	const count = watch('count');

	const getFileUrl = ({
		severity,
		event,
		startDate,
		endDate,
		count,
		type,
		startTime,
		endTime,
	}: AppLogsFilterFormData & { type: 'json' | 'csv'; count: number }): string => {
		let baseUrl = `/api/apps/${appId}/export-logs?`;
		if (severity && severity !== 'all') {
			baseUrl += `logLevel=${severity}&`;
		}
		if (event) {
			baseUrl += `method=${event}&`;
		}
		if (startDate) {
			baseUrl += `startDate=${new Date(`${startDate}T${startTime}`).toISOString()}&`;
		}
		if (endDate) {
			baseUrl += `endDate=${new Date(`${endDate}T${endTime}`).toISOString()}&`;
		}
		if (count) {
			baseUrl += `count=${count}&`;
		}
		baseUrl += `type=${type}`;
		return baseUrl;
	};

	const handleConfirm = (): void => {
		const url = getFileUrl({ ...filterValues, type, count: count === 'max' ? 2000 : getValues('customExportAmount') });
		window.open(url, '_blank', 'noopener noreferrer');
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Export')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Box display='flex' flexDirection='column' mie={10} mbe={24} flexGrow={1}>
					<Label>{t('Format')}</Label>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor='JSONField'>{t('JSON')}</FieldLabel>
							<Controller
								name='type'
								control={control}
								render={({ field: { value, onChange, ...field } }) => (
									<RadioButton
										id='json'
										{...field}
										onChange={() => onChange('json')}
										aria-describedby='JSONField'
										checked={value === 'json'}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor='plainTextField'>{t('CSV')}</FieldLabel>
							<Controller
								name='type'
								control={control}
								render={({ field: { value, onChange, ...field } }) => (
									<RadioButton
										id='csv'
										{...field}
										onChange={() => onChange('csv')}
										aria-describedby='plainTextField'
										checked={value === 'csv'}
									/>
								)}
							/>
						</FieldRow>
					</Field>
				</Box>
				<Box display='flex' flexDirection='column' mie={10} mbe={24} flexGrow={1}>
					<Label>{t('Export_most_recent_logs')}</Label>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor='maxLogsExport'>{t('Max_logs_export')}</FieldLabel>
							<Controller
								name='count'
								control={control}
								render={({ field: { value, onChange, ...field } }) => (
									<RadioButton
										id='max'
										{...field}
										onChange={() => onChange('max')}
										aria-describedby='maxLogsExport'
										checked={value === 'max'}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor='customMaxLogs'>{t('Limit_number_of_logs')}</FieldLabel>
							<Controller
								name='count'
								control={control}
								render={({ field: { value, onChange, ...field } }) => (
									<RadioButton
										id='custom'
										{...field}
										onChange={() => onChange('custom')}
										aria-describedby='customMaxLogs'
										checked={value === 'custom'}
									/>
								)}
							/>
						</FieldRow>
						<Controller
							name='customExportAmount'
							control={control}
							rules={{ required: count === 'custom', min: 1 }}
							render={({ field }) => (
								<NumberInput
									id='limit'
									min={1}
									required={count === 'custom'}
									disabled={count !== 'custom'}
									placeholder='100'
									{...field}
									aria-describedby='limitNumber'
								/>
							)}
						/>
					</Field>
				</Box>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary disabled={!isValid} onClick={handleConfirm}>
						{t('Download')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};
