import { IRoom } from '@rocket.chat/core-typings';
import { Field, Select, ButtonGroup, Button, FieldGroup, SelectOption, InputBox } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, MouseEventHandler, useMemo } from 'react';

import { useForm } from '../../../../hooks/useForm';

type MailExportFormValues = {
	dateFrom: string;
	dateTo: string;
	format: 'html' | 'json';
};

type FileExportProps = { onCancel: MouseEventHandler<HTMLOrSVGElement>; rid: IRoom['_id'] };

const FileExport: FC<FileExportProps> = ({ onCancel, rid }) => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		format: 'html',
	});

	const { dateFrom, dateTo, format } = values as MailExportFormValues;

	const { handleDateFrom, handleDateTo, handleFormat } = handlers;

	const outputOptions = useMemo<SelectOption[]>(
		() => [
			['html', t('HTML')],
			['json', t('JSON')],
		],
		[t],
	);

	const roomsExport = useEndpoint('POST', '/v1/rooms.export');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleSubmit = async (): Promise<void> => {
		try {
			await roomsExport({
				rid,
				type: 'file',
				dateFrom,
				dateTo,
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
					<InputBox type='date' value={dateFrom} onChange={handleDateFrom} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Date_to')}</Field.Label>
				<Field.Row>
					<InputBox type='date' value={dateTo} onChange={handleDateTo} />
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
				<Button primary onClick={(): Promise<void> => handleSubmit()}>
					{t('Export')}
				</Button>
			</ButtonGroup>
		</FieldGroup>
	);
};

export default FileExport;
