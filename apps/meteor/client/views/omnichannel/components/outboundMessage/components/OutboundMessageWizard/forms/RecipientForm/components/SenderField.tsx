import type { Serialized, IOutboundProviderMetadata } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { useController, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import SenderSelect from '../../../../SenderSelect';
import type { RecipientFormData } from '../RecipientForm';

type SenderFieldProps = ComponentProps<typeof Field> & {
	control: Control<RecipientFormData>;
	provider?: Serialized<IOutboundProviderMetadata>;
	disabled?: boolean;
	isLoading: boolean;
};

const SenderField = ({ control, provider, disabled = false, isLoading = false, ...props }: SenderFieldProps) => {
	const { t } = useTranslation();
	const senderFieldId = useId();

	const hasProviderOptions = !!provider && !!Object.keys(provider.templates).length;

	const {
		field: senderField,
		fieldState: { error: senderFieldError },
	} = useController({
		control,
		name: 'sender',
		rules: {
			validate: {
				noPhoneNumber: () => hasProviderOptions || t('No_phone_number_available_for_selected_channel'),
				required: (value) => (!value ? t('Required_field', { field: t('From') }) : true),
			},
		},
	});

	return (
		<Field {...props}>
			<FieldLabel is='span' required id={senderFieldId}>
				{t('From')}
			</FieldLabel>
			<FieldRow>
				<SenderSelect
					provider={provider}
					aria-busy={isLoading}
					aria-labelledby={senderFieldId}
					aria-describedby={senderFieldError && `${senderFieldId}-error`}
					aria-invalid={!!senderFieldError}
					error={senderFieldError?.message}
					disabled={disabled || isLoading}
					placeholder={isLoading ? t('Loading...') : t('Workspace_detail')}
					value={senderField.value}
					onChange={senderField.onChange}
				/>
			</FieldRow>
			{senderFieldError && (
				<FieldError aria-live='assertive' id={`${senderFieldId}-error`}>
					{senderFieldError.message}
				</FieldError>
			)}
		</Field>
	);
};

export default SenderField;
