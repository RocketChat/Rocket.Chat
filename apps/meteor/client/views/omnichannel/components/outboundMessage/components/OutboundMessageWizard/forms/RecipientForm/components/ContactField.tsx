import { Field, FieldLabel, FieldRow, Option } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { useController, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { formatPhoneNumber } from '../../../../../../../../../lib/formatPhoneNumber';
import AutoCompleteContact from '../../../../../../AutoCompleteContact';
import ContactOptionContent from '../../../../../layout/ContactOptionContent';
import FieldErrorWithRetry from '../../../../../layout/FieldErrorWithRetry';
import type { RecipientFormData } from '../RecipientForm';

export type ContactFieldProps = ComponentProps<typeof Field> & {
	control: Control<RecipientFormData>;
	isError: boolean;
	isFetching: boolean;
	onRetry: () => void;
};

type RenderFnType = Required<ComponentProps<typeof AutoCompleteContact>>['renderItem'];

const ContactField = ({ control, isError = false, isFetching = false, onRetry, ...props }: ContactFieldProps) => {
	const { t } = useTranslation();
	const contactFieldId = useId();

	const {
		field: contactField,
		fieldState: { error: contactFieldError },
	} = useController({
		control,
		name: 'contactId',
		rules: {
			validate: {
				fetchError: () => (isError ? t('Error_loading__name__information', { name: t('contact') }) : true),
				required: (value) => (!value ? t('Required_field', { field: t('Contact') }) : true),
			},
		},
	});

	const renderContactOption = useStableCallback<RenderFnType>(({ label, ...props }, { phones }) => {
		const phoneList = phones?.map((p) => formatPhoneNumber(p.phoneNumber)).join(', ');

		return (
			<Option {...props} avatar={<UserAvatar username={label} size={ITEM_MEDIA_SIZE.condensed} />}>
				<ContactOptionContent label={label} description={phoneList || undefined} />
			</Option>
		);
	});

	return (
		<Field {...props}>
			<FieldLabel required htmlFor={contactFieldId}>
				{t('Contact')}
			</FieldLabel>
			<FieldRow>
				<AutoCompleteContact
					id={contactFieldId}
					aria-describedby={contactFieldError && `${contactFieldId}-error`}
					aria-invalid={!!contactFieldError}
					placeholder={t('Select_recipient')}
					value={contactField.value}
					onChange={contactField.onChange}
					error={contactFieldError?.message}
					renderItem={renderContactOption}
				/>
			</FieldRow>
			{contactFieldError && (
				<FieldErrorWithRetry id={`${contactFieldId}-error`} canRetry={isError} retrying={isFetching} onRetry={onRetry}>
					{contactFieldError.message}
				</FieldErrorWithRetry>
			)}
		</Field>
	);
};

export default ContactField;
