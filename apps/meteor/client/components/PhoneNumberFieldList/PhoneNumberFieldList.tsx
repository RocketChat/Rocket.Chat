import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldError, TelephoneInput, TextInput } from '@rocket.chat/fuselage-forms';
import { useVisuallyHidden } from 'react-aria';
import type { ArrayPath, Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const E164_PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const MAX_PHONE_NUMBER_LABEL_LENGTH = 50;

export type PhoneFieldType = {
	id: string;
	number: string;
	label?: string;
	primary?: boolean;
};

type PhoneNumberFieldListProps<T extends FieldValues> = {
	name: ArrayPath<T>;
	phones: PhoneFieldType[];
	control: Control<T>;
	onAddPhone: (phone: Omit<Required<PhoneFieldType>, 'id'>) => void;
	onRemovePhone: (index: number) => void;
};

const PhoneNumberFieldList = <T extends FieldValues>({
	name,
	phones,
	control,
	onAddPhone,
	onRemovePhone,
}: PhoneNumberFieldListProps<T>) => {
	const { t } = useTranslation();
	const { visuallyHiddenProps } = useVisuallyHidden();

	return (
		<Box is='fieldset' display='flex' flexDirection='column' width='100%'>
			<legend {...visuallyHiddenProps}>{t('Phone_Numbers')}</legend>
			<Box is='ul' id={`${name}-phones-list`} display='flex' flexDirection='column' gap={8}>
				{phones.map((phone, index) => (
					<Box is='li' id={phone.id} key={phone.id} display='flex' gap={8} alignItems='start'>
						<Controller<T>
							control={control}
							name={`${name}.${index}.number` as Path<T>}
							rules={{
								validate: {
									required: (value: string) => (value.trim() ? true : t('Required_field', { field: `${t('Phone_number')} ${index + 1}` })),
									valid: (value: string) =>
										E164_PHONE_REGEX.test(value) ? true : t('__field__is_invalid', { field: `${t('Phone_number')} ${index + 1}` }),
								},
							}}
							render={({ field, fieldState: { error } }) => (
								<Field w='auto' flexGrow={1} flexShrink={1} flexBasis='60%'>
									<FieldLabel {...visuallyHiddenProps}>{`${t('Phone_number')} ${index + 1}`}</FieldLabel>
									<TelephoneInput {...field} flexGrow={1} error={error?.message} placeholder={t('Phone_number_placeholder')} />
									{error?.message && <FieldError>{error.message}</FieldError>}
								</Field>
							)}
						/>

						<Controller<T>
							control={control}
							name={`${name}.${index}.label` as Path<T>}
							rules={{
								maxLength: {
									value: MAX_PHONE_NUMBER_LABEL_LENGTH,
									message: t('Max_length_is', { postProcess: 'sprintf', sprintf: [MAX_PHONE_NUMBER_LABEL_LENGTH] }),
								},
							}}
							render={({ field, fieldState: { error } }) => (
								<Field w='auto' flexGrow={1} flexShrink={1} flexBasis='30%'>
									<FieldLabel {...visuallyHiddenProps}>{`${t('Label_for_phone_number__label__', { label: index + 1 })}`}</FieldLabel>
									<TextInput {...field} flexGrow={1} error={error?.message} placeholder={t('Phone_label_placeholder')} />
									{error?.message && <FieldError>{error.message}</FieldError>}
								</Field>
							)}
						/>

						<IconButton
							aria-controls={phone.id}
							title={t('Remove')}
							aria-label={t('Remove_number__label__', { label: phone.label || index + 1 })}
							small
							mb={6}
							icon='trash'
							onClick={() => onRemovePhone(index)}
						/>
					</Box>
				))}
			</Box>
			<Button aria-controls={`${name}-phones-list`} onClick={() => onAddPhone({ number: '', label: '', primary: false })} mbs={8}>
				{t('Add_number')}
			</Button>
		</Box>
	);
};

export default PhoneNumberFieldList;
