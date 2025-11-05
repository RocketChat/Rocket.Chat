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
import { useCallback, useId, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

export type AdminABACRoomAttributesFormFormData = {
	name: string;
	attributeValues: { value: string }[];
	lockedAttributes: { value: string }[];
};

type AdminABACRoomAttributesFormProps = {
	onSave: (data: unknown) => void;
	onCancel: () => void;
	description: string;
};

const AdminABACRoomAttributesForm = ({ onSave, onCancel, description }: AdminABACRoomAttributesFormProps) => {
	const {
		handleSubmit,
		register,
		formState: { errors },
		watch,
	} = useFormContext<AdminABACRoomAttributesFormFormData>();

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
		<Box is='form' onSubmit={handleSubmit(onSave)} id={formId}>
			<ContextualbarScrollableContent>
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
							{index !== 0 && <IconButton aria-label={t('Remove')} icon='trash' onClick={() => removeLockedAttribute(index)} />}
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
								<IconButton aria-label={t('Remove')} icon='trash' onClick={() => remove(index)} />
							)}
						</FieldRow>
					))}
					<FieldError>{getAttributeValuesError()}</FieldError>
					<Button
						onClick={() => append({ value: '' })}
						// Checking for values since rhf does consider the newly added field as dirty after an append() call
						disabled={!!getAttributeValuesError() || attributeValues?.some((value: { value: string }) => value?.value === '')}
					>
						{t('Add Value')}
					</Button>
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => onCancel()}>{t('Cancel')}</Button>
					<Button type='submit' disabled={hasValuesErrors || !!errors.name} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Box>
	);
};

export default AdminABACRoomAttributesForm;
