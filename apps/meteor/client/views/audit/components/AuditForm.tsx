import type { IAuditLog, IRoom } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldRow, FieldError, TextInput, Button, ButtonGroup } from '@rocket.chat/fuselage';
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

type AuditFormProps = {
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
		<form onSubmit={handleSubmit(submit)}>
			<Box display='flex' flexDirection='row' justifyContent='stretch' marginInline={-4}>
				<Field flexShrink={1} marginInline={4}>
					<FieldLabel>{t('Message')}</FieldLabel>
					<FieldRow>
						<TextInput placeholder={t('Search')} {...register('msg')} />
					</FieldRow>
				</Field>
				<Field flexShrink={1} marginInline={4}>
					<FieldLabel>{t('Date')}</FieldLabel>
					<FieldRow>
						<DateRangePicker value={dateRangeField.value} onChange={dateRangeField.onChange} display='flex' flexGrow={1} />
						{dateRangeFieldState.error?.type === 'required' && <FieldError>{t('Required_field', { field: t('Date') })}</FieldError>}
						{dateRangeFieldState.error?.type === 'validate' && <FieldError>{dateRangeFieldState.error.message}</FieldError>}
					</FieldRow>
				</Field>
			</Box>
			<Box display='flex' flexDirection='row' alignItems='flex-start'>
				{type === '' && <RoomsTab form={form} setSelectedRoom={setSelectedRoom} />}
				{type === 'u' && <UsersTab form={form} />}
				{type === 'd' && <DirectTab form={form} />}
				{type === 'l' && <OmnichannelTab form={form} />}
				<Box flexShrink={0} mbs={28} mis={8}>
					<ButtonGroup align='end'>
						<Button secondary onClick={() => window.print()}>
							{t('Export')} {t('PDF')}
						</Button>
						<Button primary type='submit'>
							{t('Apply')}
						</Button>
					</ButtonGroup>
				</Box>
			</Box>
		</form>
	);
};

export default AuditForm;
