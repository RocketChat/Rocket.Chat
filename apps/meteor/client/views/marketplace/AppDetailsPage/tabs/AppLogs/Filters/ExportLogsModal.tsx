import {
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
	Stack,
} from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { Controller, useForm, useFormState, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AppLogsFilterFormData } from '../useAppLogsFilterForm';

export type ExportLogsModalProps = {
	onClose: () => void;
	filterValues: AppLogsFilterFormData;
	onConfirm: (url: string) => void;
};

type FormDataType = {
	type: 'json' | 'csv';
	count: 'max' | 'custom';
	customExportAmount: number;
};

export const ExportLogsModal = ({ onClose, filterValues, onConfirm }: ExportLogsModalProps) => {
	const { t } = useTranslation();

	const appId = useRouteParameter('id');

	const { control, getValues } = useForm<FormDataType>({
		defaultValues: {
			type: 'json',
			count: 'max',
			customExportAmount: 100,
		},
	});
	const { isValid } = useFormState({ control });

	const type = useWatch({ control, name: 'type' });
	const count = useWatch({ control, name: 'count' });

	const getFileUrl = ({
		severity,
		event,
		instance,
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
		if (event && event !== 'all') {
			baseUrl += `method=${event}&`;
		}
		if (instance && instance !== 'all') {
			baseUrl += `instanceId=${instance}&`;
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
		onConfirm(url);
		onClose();
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Export')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Stack gap='x24'>
					<Stack is='fieldset'>
						<Label is='legend'>{t('Format')}</Label>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor='json'>{t('JSON')}</FieldLabel>
								<Controller
									name='type'
									control={control}
									render={({ field: { value, onChange, ...field } }) => (
										<RadioButton id='json' {...field} onChange={() => onChange('json')} checked={value === 'json'} />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor='csv'>{t('CSV')}</FieldLabel>
								<Controller
									name='type'
									control={control}
									render={({ field: { value, onChange, ...field } }) => (
										<RadioButton id='csv' {...field} onChange={() => onChange('csv')} checked={value === 'csv'} />
									)}
								/>
							</FieldRow>
						</Field>
					</Stack>
					<Stack is='fieldset'>
						<Label is='legend'>{t('Export_most_recent_logs')}</Label>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor='max'>{t('Max_logs_export')}</FieldLabel>
								<Controller
									name='count'
									control={control}
									render={({ field: { value, onChange, ...field } }) => (
										<RadioButton id='max' {...field} onChange={() => onChange('max')} checked={value === 'max'} />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor='custom'>{t('Limit_number_of_logs')}</FieldLabel>
								<Controller
									name='count'
									control={control}
									render={({ field: { value, onChange, ...field } }) => (
										<RadioButton id='custom' {...field} onChange={() => onChange('custom')} checked={value === 'custom'} />
									)}
								/>
							</FieldRow>
							<Controller
								name='customExportAmount'
								control={control}
								rules={{ required: count === 'custom', min: 1, max: 2000 }}
								render={({ field }) => (
									<NumberInput
										id='limit'
										min={1}
										max={2000}
										required={count === 'custom'}
										disabled={count !== 'custom'}
										placeholder='100'
										{...field}
										aria-label={t('Limit_number_of_logs')}
									/>
								)}
							/>
						</Field>
					</Stack>
				</Stack>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button variant='primary' disabled={!isValid} onClick={handleConfirm}>
						{t('Download')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};
