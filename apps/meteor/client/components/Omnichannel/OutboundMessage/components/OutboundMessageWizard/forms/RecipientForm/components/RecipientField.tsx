import type { Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { useController, type Control } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import RecipientSelect from '../../../../RecipientSelect';
import type { RecipientFormData } from '../RecipientForm';

type RecipientFieldProps = ComponentProps<typeof Field> & {
	control: Control<RecipientFormData>;
	contact?: Omit<Serialized<ILivechatContact>, 'contactManager'>;
	type: 'phone' | 'email';
	disabled?: boolean;
	isLoading: boolean;
};

const RecipientField = ({ control, contact, type, disabled = false, isLoading = false, ...props }: RecipientFieldProps) => {
	const { t } = useTranslation();
	const recipientFieldId = useId();

	const {
		field: recipientField,
		fieldState: { error: recipientFieldError },
	} = useController({
		control,
		name: 'recipient',
		rules: {
			validate: {
				noPhoneNumber: () => (type === 'phone' && contact ? !!contact.phones?.length : true),
				required: (value) => (!value ? t('Required_field', { field: t('To') }) : true),
			},
		},
	});

	return (
		<Field {...props}>
			<FieldLabel is='span' required id={`${recipientFieldId}`}>
				{t('To')}
			</FieldLabel>
			<FieldRow>
				<RecipientSelect
					contact={contact}
					type={type}
					aria-busy={isLoading}
					aria-labelledby={recipientFieldId}
					aria-describedby={recipientFieldError && `${recipientFieldId}-error`}
					aria-invalid={!!recipientFieldError}
					error={recipientFieldError && 'error'}
					placeholder={isLoading ? t('Loading...') : t('Contact_detail')}
					value={recipientField.value}
					disabled={disabled || isLoading}
					onChange={recipientField.onChange}
				/>
			</FieldRow>
			{recipientFieldError?.type === 'required' && (
				<FieldError aria-live='assertive' id={`${recipientFieldId}-error`}>
					{recipientFieldError.message}
				</FieldError>
			)}
			{recipientFieldError?.type === 'noPhoneNumber' && (
				<FieldError aria-live='assertive' id={`${recipientFieldId}-error`}>
					<Trans i18nKey='No_phone_number_yet_edit_contact'>
						No phone number yet <a href={`/omnichannel-directory/contacts/edit/${contact?._id}`}>Edit contact</a>
					</Trans>
				</FieldError>
			)}
		</Field>
	);
};

export default RecipientField;
