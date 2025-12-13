import {
	Box,
	Button,
	ButtonGroup,
	ContextualbarFooter,
	Field,
	FieldError,
	FieldLabel,
	FieldRow,
	IconButton,
	TextInput,
} from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import { useCallback, useId, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type AttributesFormFormData = {
	name: string;
	attributeValues: { value: string }[];
	lockedAttributes: { value: string }[];
};

type AttributesFormProps = {
	onSave: (data: AttributesFormFormData) => void;
	onCancel: () => void;
	description: string;
};

const AttributesForm = ({ onSave, onCancel, description }: AttributesFormProps) => {
	const {
		handleSubmit,
		register,
		formState: { errors, isDirty },
		watch,
	} = useFormContext<AttributesFormFormData>();

	const { fields: lockedAttributesFields, remove: removeLockedAttribute } = useFieldArray({
		name: 'lockedAttributes',
	});

	const { fields, append, remove } = useFieldArray({
		name: 'attributeValues',
		rules: {
			minLength: 1,
		},
	});
	const { t } = useTranslation();

	const formId = useId();
	const nameField = useId();
	const valuesField = useId();
	const attributeValues = watch('attributeValues');

	const getAttributeValuesError = useCallback(() => {
		if (errors.attributeValues?.length && errors.attributeValues?.length > 0) {
			return t('Required_field', { field: t('Values') });
		}
		return '';
	}, [errors.attributeValues, t]);

	const hasValuesErrors = useMemo(() => {
		const attributeValuesErrors = Array.isArray(errors?.attributeValues) && errors.attributeValues.some((error) => !!error?.value?.message);
		const lockedAttributesErrors =
			Array.isArray(errors?.lockedAttributes) && errors.lockedAttributes.some((error) => !!error?.value?.message);
		return attributeValuesErrors || lockedAttributesErrors;
	}, [errors.attributeValues, errors.lockedAttributes]);

	return (
		<>
			<ContextualbarScrollableContent>
				<Box is='form' onSubmit={handleSubmit(onSave)} id={formId}>
					<Box>{description}</Box>
					<Field mb={16}>
						<FieldLabel htmlFor={nameField} required>
							{t('Name')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								error={errors.name?.message}
								id={nameField}
								{...register('name', { required: t('Required_field', { field: t('Name') }) })}
							/>
						</FieldRow>
						<FieldError>{errors.name?.message || ''}</FieldError>
					</Field>
					<Field mb={16}>
						<FieldLabel required id={valuesField}>
							{t('Values')}
						</FieldLabel>
						{lockedAttributesFields.map((field, index) => (
							<FieldRow key={field.id}>
								<TextInput
									disabled
									aria-labelledby={valuesField}
									error={errors.lockedAttributes?.[index]?.value?.message || ''}
									{...register(`lockedAttributes.${index}.value`, { required: t('Required_field', { field: t('Values') }) })}
								/>
								{index !== 0 && <IconButton title={t('ABAC_Remove_attribute')} icon='trash' onClick={() => removeLockedAttribute(index)} />}
							</FieldRow>
						))}
						{fields.map((field, index) => (
							<FieldRow key={field.id}>
								<TextInput
									aria-labelledby={valuesField}
									error={errors.attributeValues?.[index]?.value?.message || ''}
									{...register(`attributeValues.${index}.value`, { required: t('Required_field', { field: t('Values') }) })}
								/>
								{(index !== 0 || lockedAttributesFields.length > 0) && (
									<IconButton title={t('ABAC_Remove_attribute')} icon='trash' onClick={() => remove(index)} />
								)}
							</FieldRow>
						))}
						<FieldError>{getAttributeValuesError()}</FieldError>
						<Button
							onClick={() => append({ value: '' })}
							// Checking for values since rhf does consider the newly added field as dirty after an append() call
							disabled={!!getAttributeValuesError() || attributeValues?.some((value: { value: string }) => value?.value === '')}
						>
							{t('Add_Value')}
						</Button>
					</Field>
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => onCancel()}>{t('Cancel')}</Button>
					<Button type='submit' form={formId} disabled={hasValuesErrors || !!errors.name || !isDirty} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AttributesForm;
