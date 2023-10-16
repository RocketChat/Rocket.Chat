import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select, ButtonGroup, Button, FieldGroup, InputBox } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, MouseEventHandler } from 'react';
import React, { useMemo } from 'react';

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
				<FieldLabel>{t('Date_From')}</FieldLabel>
				<FieldRow>
					<InputBox type='date' value={dateFrom} onChange={handleDateFrom} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel>{t('Date_to')}</FieldLabel>
				<FieldRow>
					<InputBox type='date' value={dateTo} onChange={handleDateTo} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel>{t('Output_format')}</FieldLabel>
				<FieldRow>
					<Select value={format} onChange={handleFormat} placeholder={t('Format')} options={outputOptions} />
				</FieldRow>
			</Field>
			<ButtonGroup stretch mb={12}>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary onClick={(): Promise<void> => handleSubmit()}>
					{t('Export')}
				</Button>
			</ButtonGroup>
		</FieldGroup>
	);
};

export default FileExport;
