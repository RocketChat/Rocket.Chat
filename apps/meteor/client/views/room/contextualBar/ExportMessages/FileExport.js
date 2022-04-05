import { Field, TextInput, Select, ButtonGroup, Button, FieldGroup } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useEndpoint } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useForm } from '../../../../hooks/useForm';

const FileExport = ({ onCancel, rid }) => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		format: 'html',
	});

	const { dateFrom, dateTo, format } = values;

	const { handleDateFrom, handleDateTo, handleFormat } = handlers;

	const outputOptions = useMemo(
		() => [
			['html', t('HTML')],
			['json', t('JSON')],
		],
		[t],
	);

	const roomsExport = useEndpoint('POST', 'rooms.export');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleSubmit = async () => {
		try {
			await roomsExport({
				rid,
				type: 'file',
				...(dateFrom && { dateFrom: new Date(dateFrom) }),
				...(dateTo && { dateTo: new Date(dateTo) }),
				format,
			});

			dispatchToastMessage({
				type: 'success',
				message: t('Your_email_has_been_queued_for_sending'),
			});
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	};

	return (
		<FieldGroup>
			<Field>
				<Field.Label>{t('Date_From')}</Field.Label>
				<Field.Row>
					<TextInput type='date' value={dateFrom} onChange={handleDateFrom} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Date_to')}</Field.Label>
				<Field.Row>
					<TextInput type='date' value={dateTo} onChange={handleDateTo} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Output_format')}</Field.Label>
				<Field.Row>
					<Select value={format} onChange={handleFormat} placeholder={t('Format')} options={outputOptions} />
				</Field.Row>
			</Field>
			<ButtonGroup stretch mb='x12'>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary onClick={() => handleSubmit()}>
					{t('Export')}
				</Button>
			</ButtonGroup>
		</FieldGroup>
	);
};

export default FileExport;
