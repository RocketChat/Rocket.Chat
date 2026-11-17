import type { IAuditLog, IRoom } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldRow, FieldError, TextInput, Button, ButtonGroup, Stack } from '@rocket.chat/fuselage';
import type { Dispatch, SetStateAction } from 'react';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AuditFields } from '../hooks/useAuditForm';
import { useAuditForm } from '../hooks/useAuditForm';
import { useSendTelemetryMutation } from '../hooks/useSendTelemetryMutation';
import DateRangePicker from './forms/DateRangePicker';
import DirectTab from './tabs/DirectTab';
import OmnichannelTab from './tabs/OmnichannelTab';
import RoomsTab from './tabs/RoomsTab';
import UsersTab from './tabs/UsersTab';

export type AuditFormProps = {
	type: IAuditLog['fields']['type'];
	onSubmit?: (payload: { type: IAuditLog['fields']['type'] } & AuditFields) => void;
	setSelectedRoom: Dispatch<SetStateAction<IRoom | undefined>>;
};

const AuditForm = ({ type, onSubmit, setSelectedRoom }: AuditFormProps) => {
	const { t } = useTranslation();

	const form = useAuditForm();
	const { control, handleSubmit, register } = form;

	const { field: dateRangeField, fieldState: dateRangeFieldState } = useController({ name: 'dateRange', control });

	const sendTelemetryMutation = useSendTelemetryMutation();

	const submit = () => {
		sendTelemetryMutation.mutate({
			params: [{ eventName: 'updateCounter', settingsId: 'Message_Auditing_Apply_Count', timestamp: Date.now() }],
		});

		onSubmit?.({ type, ...form.getValues() });
	};

	return (
		<Box is='form' onSubmit={handleSubmit(submit)} display='flex' flexDirection='column' gap={4}>
			<Stack direction='row' gap={8}>
				<Box width='full'>
					<Field>
						<FieldLabel>{t('Message')}</FieldLabel>
						<FieldRow>
							<TextInput placeholder={t('Search')} {...register('msg')} />
						</FieldRow>
					</Field>
				</Box>
				<Box width='full'>
					<Field>
						<FieldLabel>{t('Date')}</FieldLabel>
						<FieldRow>
							<DateRangePicker value={dateRangeField.value} onChange={dateRangeField.onChange} flexGrow={1} />
							{dateRangeFieldState.error?.type === 'required' && <FieldError>{t('Required_field', { field: t('Date') })}</FieldError>}
							{dateRangeFieldState.error?.type === 'validate' && <FieldError>{dateRangeFieldState.error.message}</FieldError>}
						</FieldRow>
					</Field>
				</Box>
			</Stack>
			<Stack direction='row' align='start' gap={8}>
				{type === '' && <RoomsTab form={form} setSelectedRoom={setSelectedRoom} />}
				{type === 'u' && <UsersTab form={form} />}
				{type === 'd' && <DirectTab form={form} />}
				{type === 'l' && <OmnichannelTab form={form} />}
				<Box flexShrink={0} marginBlockStart='x24'>
					<ButtonGroup align='end'>
						<Button variant='secondary' onClick={() => window.print()}>
							{t('Export')} {t('PDF')}
						</Button>
						<Button variant='primary' type='submit'>
							{t('Apply')}
						</Button>
					</ButtonGroup>
				</Box>
			</Stack>
		</Box>
	);
};

export default AuditForm;
