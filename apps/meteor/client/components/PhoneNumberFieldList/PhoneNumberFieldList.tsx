import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldError, FieldHint, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { useVisuallyHidden } from 'react-aria';
import type { ArrayPath, Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { E164_PHONE_REGEX } from './e164PhoneRegex';

const MAX_PHONE_NUMBER_LABEL_LENGTH = 50;

export type PhoneFieldType = {
	id: string;
	number: string;
	label?: string;
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
			<Box is='ul' id={`${name}-phones-list`} display='flex' flexDirection='column' gap={16}>
				{phones.map((phone, index) => (
					<Box is='li' id={phone.id} key={phone.id} display='flex' flexDirection='column' gap={4}>
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
							// TODO: add back type='tel' to the Input
							render={({ field, fieldState: { error } }) => (
								<Field>
									<FieldLabel>{t('Phone_number')}</FieldLabel>
									<FieldRow>
										<TextInput {...field} aria-label={`${t('Phone_number')} ${index + 1}`} flexGrow={1} error={error?.message} />
										<IconButton
											aria-controls={phone.id}
											title={t('Remove')}
											aria-label={t('Remove_number__label__', { label: phone.label || index + 1 })}
											small
											icon='trash'
											onClick={() => onRemovePhone(index)}
										/>
									</FieldRow>
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
									message: t('Max_length_is', { limit: MAX_PHONE_NUMBER_LABEL_LENGTH }),
								},
							}}
							render={({ field, fieldState: { error } }) => (
								<Field>
									<FieldLabel>{t('Label')}</FieldLabel>
									<FieldRow>
										<TextInput
											{...field}
											aria-label={t('Label_for_phone_number__label__', { label: index + 1 })}
											flexGrow={1}
											error={error?.message}
											placeholder={t('Phone_label_placeholder')}
										/>
									</FieldRow>
									<FieldHint>{t('Phone_label_hint')}</FieldHint>
									{error?.message && <FieldError>{error.message}</FieldError>}
								</Field>
							)}
						/>
					</Box>
				))}
			</Box>
			<Box>
				<Button
					small
					icon='plus'
					aria-controls={`${name}-phones-list`}
					onClick={() => onAddPhone({ number: '', label: '' })}
					marginBlockStart={phones.length ? 16 : 0}
				>
					{t('Add_number')}
				</Button>
			</Box>
		</Box>
	);
};

export default PhoneNumberFieldList;
