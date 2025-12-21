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
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useId, useMemo, Fragment, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { useViewRoomsAction } from '../hooks/useViewRoomsAction';

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
		getValues,
	} = useFormContext<AttributesFormFormData>();

	const { t } = useTranslation();

	const attributeValues = watch('attributeValues');
	const lockedAttributes = watch('lockedAttributes');

	const isAttributeUsed = useEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', { key: getValues('name') });

	const { fields: lockedAttributesFields, remove: removeLockedAttributeField } = useFieldArray({
		name: 'lockedAttributes',
	});

	const validateRepeatedValues = useCallback(
		(value: string) => {
			// Only one instance of the same attribute value is allowed to be in the form at a time
			const repeatedAttributes = [...lockedAttributes, ...attributeValues].filter((attribute) => attribute.value === value).length > 1;
			return repeatedAttributes ? t('ABAC_No_repeated_values') : undefined;
		},
		[lockedAttributes, attributeValues, t],
	);

	const { fields, append, remove } = useFieldArray({
		name: 'attributeValues',
		rules: {
			minLength: 1,
		},
	});

	const formId = useId();
	const nameField = useId();
	const valuesField = useId();

	const [showDisclaimer, setShowDisclaimer] = useState<number[]>([]);
	const viewRoomsAction = useViewRoomsAction();

	const removeLockedAttribute = useEffectEvent(async (index: number) => {
		const isInUse = await isAttributeUsed();
		if (showDisclaimer.includes(index)) {
			return;
		}
		if (isInUse?.inUse) {
			return setShowDisclaimer((prev) => [...prev, index]);
		}
		return removeLockedAttributeField(index);
	});

	const getAttributeValuesError = useCallback(() => {
		if (errors.attributeValues?.length && errors.attributeValues?.length > 0) {
			return errors.attributeValues[0]?.value?.message;
		}

		return '';
	}, [errors.attributeValues]);

	const hasValuesErrors = useMemo(() => {
		const attributeValuesErrors = Array.isArray(errors?.attributeValues) && errors.attributeValues.some((error) => !!error?.value?.message);
		const lockedAttributesErrors =
			Array.isArray(errors?.lockedAttributes) && errors.lockedAttributes.some((error) => !!error?.value?.message);
		return attributeValuesErrors || lockedAttributesErrors;
	}, [errors.attributeValues, errors.lockedAttributes]);

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(onSave)} id={formId}>
				<Box>{description}</Box>
				<Field>
					<FieldLabel htmlFor={nameField} required>
						{t('Name')}
					</FieldLabel>
					<FieldRow>
						<TextInput
							error={errors.name?.message}
							id={nameField}
							aria-required='true'
							{...register('name', { required: t('Required_field', { field: t('Name') }) })}
							aria-invalid={errors.name ? 'true' : 'false'}
							aria-describedby={errors.name ? `${nameField}-error` : undefined}
						/>
					</FieldRow>
					{errors.name && (
						<FieldError id={`${nameField}-error`} role='alert'>
							{errors.name.message}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel required id={valuesField}>
						{t('Values')}
					</FieldLabel>
					{lockedAttributesFields.map((field, index) => (
						<Fragment key={field.id}>
							<FieldRow key={field.id}>
								<TextInput
									disabled
									aria-labelledby={valuesField}
									aria-describedby={errors.lockedAttributes?.[index]?.value ? `${valuesField}-lockedAttr-${index}-error` : undefined}
									error={errors.lockedAttributes?.[index]?.value?.message || ''}
									aria-invalid={errors.lockedAttributes?.[index]?.value ? 'true' : 'false'}
									aria-required='true'
									{...register(`lockedAttributes.${index}.value`, {
										required: t('Required_field', { field: t('Values') }),
										validate: (value: string) => validateRepeatedValues(value),
									})}
								/>
								{index !== 0 && (
									<IconButton mis={8} small title={t('ABAC_Remove_attribute')} icon='trash' onClick={() => removeLockedAttribute(index)} />
								)}
							</FieldRow>
							{errors.lockedAttributes?.[index]?.value && (
								<FieldError id={`${valuesField}-lockedAttr-${index}-error`} role='alert'>
									{errors.lockedAttributes?.[index]?.value?.message}
								</FieldError>
							)}
							{showDisclaimer.includes(index) && (
								<FieldError>
									<Trans
										i18nKey='ABAC_Cannot_delete_attribute_value_in_use'
										components={{
											1: (
												<Box
													is='a'
													onClick={(e) => {
														e.preventDefault();
														viewRoomsAction(getValues('name'));
													}}
												>
													{t('ABAC_View_rooms')}
												</Box>
											),
										}}
									/>
								</FieldError>
							)}
						</Fragment>
					))}
					{fields.map((field, index) => (
						<Fragment key={field.id}>
							<FieldRow>
								<TextInput
									aria-labelledby={valuesField}
									aria-describedby={errors.attributeValues?.[index]?.value ? `${valuesField}-attr-${index}-error` : undefined}
									error={errors.attributeValues?.[index]?.value?.message || ''}
									aria-invalid={errors.attributeValues?.[index]?.value ? 'true' : 'false'}
									aria-required='true'
									{...register(`attributeValues.${index}.value`, {
										required: t('Required_field', { field: t('Values') }),
										validate: (value: string) => validateRepeatedValues(value),
									})}
								/>
								{(index !== 0 || lockedAttributesFields.length > 0) && (
									<IconButton mis={8} small title={t('ABAC_Remove_attribute')} icon='trash' onClick={() => remove(index)} />
								)}
							</FieldRow>
							{errors.attributeValues?.[index]?.value && (
								<FieldError id={`${valuesField}-attr-${index}-error`} role='alert'>
									{errors.attributeValues[index].value.message}
								</FieldError>
							)}
						</Fragment>
					))}
					<Button
						mb={8}
						onClick={() => append({ value: '' })}
						// Checking for values since rhf does consider the newly added field as dirty after an append() call
						disabled={!!getAttributeValuesError() || attributeValues?.some((value: { value: string }) => value?.value === '')}
					>
						{t('Add_Value')}
					</Button>
				</Field>
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
