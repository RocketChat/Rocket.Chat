import type { Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import type { ComponentProps } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useTimeFromNow } from '../../../../../../../../../hooks/useTimeFromNow';
import { findLastChatFromChannel } from '../../../../../utils/findLastChatFromChannel';
import AutoCompleteOutboundProvider from '../../../../AutoCompleteOutboundProvider';
import RetryButton from '../../../components/RetryButton';
import { cxp } from '../../../utils/cx';
import type { RecipientFormData } from '../RecipientForm';

type ProviderFieldProps = ComponentProps<typeof Field> & {
	control: Control<RecipientFormData>;
	contact?: Omit<Serialized<ILivechatContact>, 'contactManager'>;
	disabled?: boolean;
	isError: boolean;
	isFetching: boolean;
	onRetry: () => void;
};

const ProviderField = ({
	control,
	contact,
	disabled = false,
	isError = false,
	isFetching = false,
	onRetry,
	...props
}: ProviderFieldProps) => {
	const { t } = useTranslation();
	const channelFieldId = useId();
	const getTimeFromNow = useTimeFromNow(true);

	const {
		field: providerField,
		fieldState: { error: providerFieldError },
	} = useController({
		control,
		name: 'providerId',
		rules: {
			validate: {
				fetchError: () => (isError ? t('Error_loading__name__information', { name: t('channel') }) : true),
				required: (value) => (!value ? t('Required_field', { field: t('Channel') }) : true),
			},
		},
	});

	const providerLastChat = useMemo(() => {
		return findLastChatFromChannel(contact?.channels, providerField.value);
	}, [contact?.channels, providerField.value]);

	return (
		<Field {...props}>
			<FieldLabel is='span' required id={channelFieldId}>
				{t('Channel')}
			</FieldLabel>
			<FieldRow>
				<AutoCompleteOutboundProvider
					contact={contact}
					aria-labelledby={channelFieldId}
					aria-invalid={!!providerFieldError}
					aria-describedby={cxp(channelFieldId, {
						error: !!providerFieldError,
						hint: !!providerLastChat,
					})}
					error={providerFieldError?.message}
					disabled={disabled}
					placeholder={t('Select_channel')}
					value={providerField.value}
					onChange={providerField.onChange}
				/>
			</FieldRow>
			{providerFieldError && (
				<FieldError aria-live='assertive' id={`${channelFieldId}-error`} display='flex' alignItems='center'>
					{providerFieldError.message}
					{isError && <RetryButton loading={isFetching} onClick={onRetry} />}
				</FieldError>
			)}
			{providerLastChat && (
				<FieldHint id={`${channelFieldId}-hint`}>{t('Last_contact__time__', { time: getTimeFromNow(providerLastChat) })}</FieldHint>
			)}
		</Field>
	);
};

export default ProviderField;
