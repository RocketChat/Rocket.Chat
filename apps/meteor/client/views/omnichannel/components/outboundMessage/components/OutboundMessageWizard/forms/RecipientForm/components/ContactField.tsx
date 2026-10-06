import { Field, FieldError, FieldLabel, FieldRow, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { useController, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { formatPhoneNumber } from '../../../../../../../../../lib/formatPhoneNumber';
import AutoCompleteContact from '../../../../../../AutoCompleteContact';
import RetryButton from '../../../components/RetryButton';
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

	const renderContactOption = useStableCallback<RenderFnType>(
		({ label, value: _value, index: _index, selected, focus, ...props }, { phones }) => {
			const phoneList = phones?.map((p) => formatPhoneNumber(p.phoneNumber)).join(', ');

			return (
				<Item {...props} inset='md' selected={selected} focused={focus} aria-selected={selected}>
					<ItemMedia>
						<UserAvatar username={label} size={ITEM_MEDIA_SIZE.condensed} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>
							{label}
							{phones?.length ? (
								<ItemDescription inline title={phoneList}>
									{`(${phoneList})`}
								</ItemDescription>
							) : null}
						</ItemTitle>
					</ItemContent>
				</Item>
			);
		},
	);

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
