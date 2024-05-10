import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select, ButtonGroup, Button, FieldGroup, InputBox } from '@rocket.chat/fuselage';
import { useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../components/Contextualbar';
import type { MailExportFormValues } from './ExportMessages';
import { useRoomExportMutation } from './useRoomExportMutation';

type FileExportProps = {
	formId: string;
	rid: IRoom['_id'];
	onCancel: () => void;
	exportOptions: SelectOption[];
};

const FileExport = ({ formId, rid, exportOptions, onCancel }: FileExportProps) => {
	const t = useTranslation();
	const { control, handleSubmit } = useFormContext<MailExportFormValues>();
	const roomExportMutation = useRoomExportMutation();
	const formFocus = useAutoFocus<HTMLFormElement>();

	const outputOptions = useMemo<SelectOption[]>(
		() => [
			['html', t('HTML')],
			['json', t('JSON')],
		],
		[t],
	);

	const handleExport = ({ type, dateFrom, dateTo, format }: MailExportFormValues) => {
		roomExportMutation.mutateAsync({
			rid,
			type,
			dateFrom,
			dateTo,
			format,
		});
	};

	const typeField = useUniqueId();
	const dateFromField = useUniqueId();
	const dateToField = useUniqueId();
	const formatField = useUniqueId();

	return (
		<>
			<ContextualbarScrollableContent>
				<form ref={formFocus} tabIndex={-1} aria-labelledby={`${formId}-title`} id={formId} onSubmit={handleSubmit(handleExport)}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={typeField}>{t('Method')}</FieldLabel>
							<FieldRow>
								<Controller
									name='type'
									control={control}
									render={({ field }) => <Select id={typeField} {...field} placeholder={t('Type')} options={exportOptions} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={dateFromField}>{t('Date_From')}</FieldLabel>
							<FieldRow>
								<Controller
									name='dateFrom'
									control={control}
									render={({ field }) => <InputBox id={dateFromField} type='date' {...field} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={dateToField}>{t('Date_to')}</FieldLabel>
							<FieldRow>
								<Controller name='dateTo' control={control} render={({ field }) => <InputBox id={dateToField} {...field} type='date' />} />
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={formatField}>{t('Output_format')}</FieldLabel>
							<FieldRow>
								<Controller
									name='format'
									control={control}
									render={({ field }) => <Select {...field} id={formatField} placeholder={t('Format')} options={outputOptions} />}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button form={formId} primary type='submit'>
						{t('Export')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default FileExport;
