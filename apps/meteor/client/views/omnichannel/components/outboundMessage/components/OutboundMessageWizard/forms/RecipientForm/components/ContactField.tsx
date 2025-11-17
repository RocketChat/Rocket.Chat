import { Box, Field, FieldError, FieldLabel, FieldRow, Option, OptionContent, OptionDescription } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { useController, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { formatPhoneNumber } from '../../../../../../../../../lib/formatPhoneNumber';
import AutoCompleteContact from '../../../../../../AutoCompleteContact';
import RetryButton from '../../../components/RetryButton';
import type { RecipientFormData } from '../RecipientForm';

type ContactFieldProps = ComponentProps<typeof Field> & {
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

	const renderContactOption = useEffectEvent<RenderFnType>(({ label, ...props }, { phones }) => {
		const phoneList = phones?.map((p) => formatPhoneNumber(p.phoneNumber)).join(', ');

		return (
			<Option {...props} avatar={<UserAvatar title={label} username={label} size='x20' />}>
				<Box is={OptionContent} mie='auto' flexGrow={0} flexShrink={0} flexBasis={0}>
					{label}
				</Box>
				{phones?.length ? (
					<Box withTruncatedText flexGrow={0} flexShrink={1} title={phoneList}>
						<OptionDescription>{`(${phoneList})`}</OptionDescription>
					</Box>
				) : null}
			</Option>
		);
	});

	return (
		<Field {...props}>
			<FieldLabel is='span' required id={contactFieldId}>
				{t('Contact')}
			</FieldLabel>
			<FieldRow>
				<AutoCompleteContact
					aria-labelledby={contactFieldId}
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
				<FieldError aria-live='assertive' id={`${contactFieldId}-error`} display='flex' alignItems='center'>
					{contactFieldError.message}
					{isError && <RetryButton loading={isFetching} onClick={onRetry} />}
				</FieldError>
			)}
		</Field>
	);
};

export default ContactField;
