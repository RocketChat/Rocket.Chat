import { Box, IconButton, Stack } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldError, FieldHint, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { useId } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { PhoneNumbersFormValues } from './phoneNumbers';
import { MAX_PHONE_NUMBER_LABEL_LENGTH, validatePhoneNumber } from './phoneNumbers';

type PhoneNumberFieldRowProps = {
	control: Control<PhoneNumbersFormValues>;
	index: number;
	onRemove: (index: number) => void;
	className?: string;
};

const PhoneNumberFieldRow = ({ control, index, onRemove, className }: PhoneNumberFieldRowProps) => {
	const { t } = useTranslation();
	const id = useId();
	const label = useWatch({ control, name: `phones.${index}.label` });

	return (
		<Box is='li' id={id} display='flex' flexDirection='column' gap={4}>
			<Controller
				control={control}
				name={`phones.${index}.number`}
				rules={{
					validate: (_, formValues) => validatePhoneNumber(formValues.phones[index], index, t),
				}}
				render={({ field, fieldState: { error } }) => (
					<Field className={className}>
						<FieldLabel>{t('Phone_number')}</FieldLabel>
						<FieldRow>
							<Stack direction='row' align='center' grow gap={8}>
								<TextInput {...field} type='tel' aria-label={`${t('Phone_number')} ${index + 1}`} error={error?.message} />
								<IconButton
									aria-controls={id}
									title={t('Remove')}
									aria-label={t('Remove_number__label__', { label: label?.trim() || index + 1 })}
									icon='trash'
									onClick={() => onRemove(index)}
								/>
							</Stack>
						</FieldRow>
						{error?.message && <FieldError>{error.message}</FieldError>}
					</Field>
				)}
			/>

			<Controller
				control={control}
				name={`phones.${index}.label`}
				rules={{
					deps: [`phones.${index}.number`],
					maxLength: {
						value: MAX_PHONE_NUMBER_LABEL_LENGTH,
						message: t('Max_length_is', { limit: MAX_PHONE_NUMBER_LABEL_LENGTH }),
					},
				}}
				render={({ field, fieldState: { error } }) => (
					<Field className={className}>
						<FieldLabel>{t('Label')}</FieldLabel>
						<FieldRow>
							<TextInput
								{...field}
								value={field.value ?? ''}
								aria-label={t('Label_for_phone_number__label__', { label: index + 1 })}
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
	);
};

export default PhoneNumberFieldRow;
