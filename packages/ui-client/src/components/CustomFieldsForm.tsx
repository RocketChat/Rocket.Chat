import type { CustomFieldMetadata } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, FieldError, Select, TextInput } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useCallback, useId, useMemo } from 'react';
import type { Control, FieldValues, FieldError as RHFFieldError } from 'react-hook-form';
import { Controller, useFormState, get } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type CustomFieldFormProps<T extends FieldValues> = {
	metadata: CustomFieldMetadata[];
	formControl: Control<T>;
	formName: string;
};

type CustomFieldProps<T extends FieldValues> = Omit<CustomFieldMetadata, 'name'> & {
	control: Control<T>;
	name: string;
};

const FIELD_TYPES = {
	select: Select,
	text: TextInput,
} as const;

const CustomField = <T extends FieldValues>({
	name,
	type,
	control,
	label,
	required,
	defaultValue,
	options = [],
	...props
}: CustomFieldProps<T>) => {
	const { t } = useTranslation();
	const { errors } = useFormState({ control });
	const fieldId = useId();

	const Component = FIELD_TYPES[type] ?? null;

	const selectOptions = useMemo(
		() =>
			options.length > 0 && options[0] instanceof Array ? options : options.map((option) => [option, option, defaultValue === option]),
		[defaultValue, options],
	);

	const validateRequired = useCallback((value: string) => (required ? typeof value === 'string' && !!value.trim() : true), [required]);

	const getErrorMessage = useCallback(
		(error: RHFFieldError) => {
			switch (error?.type) {
				case 'required':
					return t('Required_field', { field: label || name });
				case 'minLength':
					return t('Min_length_is', { postProcess: 'sprintf', sprintf: [props?.minLength] });
				case 'maxLength':
					return t('Max_length_is', { postProcess: 'sprintf', sprintf: [props?.maxLength] });
			}
		},
		[label, name, props?.maxLength, props?.minLength, t],
	);

	const error = get(errors, name);
	const errorMessage = useMemo(() => getErrorMessage(error), [error, getErrorMessage]);

	return (
		<Controller<T, any>
			name={name}
			control={control}
			defaultValue={defaultValue ?? ''}
			rules={{ minLength: props.minLength, maxLength: props.maxLength, validate: { required: validateRequired } }}
			render={({ field }) => (
				<Field rcx-field-group__item>
					<FieldLabel htmlFor={fieldId} required={required}>
						{label || t(name as TranslationKey)}
					</FieldLabel>
					<FieldRow>
						<Component
							{...props}
							{...field}
							id={fieldId}
							aria-describedby={`${fieldId}-error`}
							error={errorMessage}
							options={selectOptions as SelectOption[]}
							flexGrow={1}
						/>
					</FieldRow>
					<FieldError aria-live='assertive' id={`${fieldId}-error`}>
						{errorMessage}
					</FieldError>
				</Field>
			)}
		/>
	);
};

// eslint-disable-next-line react/no-multi-comp
export const CustomFieldsForm = <T extends FieldValues>({ formName, formControl, metadata }: CustomFieldFormProps<T>) => (
	<>
		{metadata.map(({ name: fieldName, ...props }) => {
			props.label = props.label ?? fieldName;
			return <CustomField key={fieldName} name={`${formName}.${fieldName}`} control={formControl} {...props} />;
		})}
	</>
);
