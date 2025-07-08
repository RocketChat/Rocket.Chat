import { Box, Button, Field, FieldLabel, FieldRow, Label, Modal, NumberInput, RadioButton } from '@rocket.chat/fuselage';
import { useEndpoint, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
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

export const ExportLogsModal = ({ onClose, filterValues }: ExportLogsModalProps): ReactNode => {
	const { t } = useTranslation();

	const appId = useRouteParameter('id');

	const { control, watch } = useForm<FormDataType>({
		defaultValues: {
			type: 'json',
			count: 'max',
			customExportAmount: 100,
		},
	});

	const formData = watch();

	console.log(formData);

	const getExportedFile = useEndpoint('GET', `/apps/:id/export-logs`, { id: appId } as { id: string });

	const handleConfirm = (): void => {
		const { severity, event: method, startDate, endDate } = filterValues;
		const logLevel = severity === 'all' ? undefined : severity;
		getExportedFile({
			logLevel,
			method,
			startDate,
			endDate,
			count: formData.count === 'max' ? 2000 : formData.customExportAmount,
			type: formData.type,
		});
	};

	return (
		<Modal title={t('Custom_time_range')}>
			<Modal.Header>
				<Modal.Title>{t('Export')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
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
							render={({ field }) => (
								<NumberInput id='limit' disabled={formData.count !== 'custom'} placeholder='0' {...field} aria-describedby='limitNumber' />
							)}
						/>
					</Field>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={handleConfirm}>
						{t('Download')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};
