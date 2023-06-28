import type { CustomFieldMetadata } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select, TextInput } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Control, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';

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
	const { getFieldState } = control;

	const Component = FIELD_TYPES[type] ?? null;

	const selectOptions =
		options.length > 0 && options[0] instanceof Array ? options : options.map((option) => [option, option, defaultValue === option]);

	const getErrorMessage = (error: any) => {
		switch (error?.type) {
			case 'required':
				return t('The_field_is_required', label || name);
			case 'minLength':
				return t('Min_length_is', props?.minLength);
			case 'maxLength':
				return t('Max_length_is', props?.maxLength);
		}
	};

	const error = getErrorMessage(getFieldState(name as any).error);

	return (
		<Controller<T, any>
			name={name}
			control={control}
			defaultValue={defaultValue ?? ''}
			rules={{ required, minLength: props.minLength, maxLength: props.maxLength }}
			render={({ field }) => (
				<Field rcx-field-group__item>
					<Field.Label>
						{label || t(name as TranslationKey)}
						{required && '*'}
					</Field.Label>
					<Field.Row>
						<Component {...props} {...field} error={error} options={selectOptions as SelectOption[]} flexGrow={1} />
					</Field.Row>
					<Field.Error>{error}</Field.Error>
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
