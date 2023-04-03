/* eslint-disable react/no-multi-comp */
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select, TextInput } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { Controller, get } from 'react-hook-form';

export type CustomFieldMetadata = {
	name: string;
	label: string;
	type: 'select' | 'text';
	required?: boolean;
	defaultValue?: any;
	options?: SelectOption[];
};

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
	const t = useTranslation();
	const Component = FIELD_TYPES[type] ?? null;

	return (
		<Controller<T, any>
			name={name}
			control={control}
			defaultValue={defaultValue ?? ''}
			rules={{ required: t('The_field_is_required', label || name) }}
			render={({ field, formState: { errors } }) => (
				<Field>
					<Field.Label>
						{label || t(name as TranslationKey)}
						{required && '*'}
					</Field.Label>
					<Field.Row>
						<Component {...props} {...field} options={options} error={get(errors, name) as string} flexGrow={1} />
					</Field.Row>
					<Field.Error>{get(errors, name)?.message}</Field.Error>
				</Field>
			)}
		/>
	);
};

CustomField.displayName = 'CustomField';

export const CustomFieldsForm = <T extends FieldValues>({ formName, formControl, metadata }: CustomFieldFormProps<T>) => (
	<>
		{metadata.map(({ name: fieldName, ...props }) => (
			<CustomField key={fieldName} name={`${formName}.${fieldName}`} control={formControl} {...props} />
		))}
	</>
);
