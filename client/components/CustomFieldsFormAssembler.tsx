import { TextInput, Select, Field } from '@rocket.chat/fuselage';

import React, { useMemo, ReactElement } from 'react';

import { ICustomField } from '../../definition/ICustomField';
import { useTranslation, TranslationKey } from '../contexts/TranslationContext';

interface ICustomFieldComponentProps {
	label?: string;
	name: string;
	required?: boolean;
	className?: string;
	register: unknown;
	error?: unknown;
}

interface ICustomTextInputProps extends ICustomFieldComponentProps {
	minLength?: number;
	maxLength?: number;
}

interface ICustomSelectProps extends ICustomFieldComponentProps {
	options: { label:string, value:string }[];
}

const CustomTextInput = ({
	label,
	name,
	required,
	minLength,
	maxLength,
	className,
	error,
	register,
}: ICustomTextInputProps): ReactElement => {
	const t = useTranslation();

	return useMemo(
		() => (
			<Field className={className}>
				<Field.Label>
					{label || t(name as TranslationKey)}
					{required && '*'}
				</Field.Label>
				<Field.Row>
					<TextInput {...register(name, { required, minLength, maxLength })} />
				</Field.Row>
				<Field.Error>{error}</Field.Error>
			</Field>
		),
		[className, label, t, name, required, register, minLength, maxLength, error],
	);
};

const CustomSelect = ({
	label,
	name,
	required,
	options = [],
	className,
	register,
	error,
}: ICustomSelectProps): ReactElement => {
	const t = useTranslation();

	const mappedOptions = useMemo(() => Object.values(options).map((value) => { value: value, label: value}), [options]);

	return useMemo(
		() => (
			<Field className={className}>
				<Field.Label>
					{label || t(name as TranslationKey)}
					{required && '*'}
				</Field.Label>
				<Field.Row>
					<Select
						options={mappedOptions}
						{...register(name, { required })}
					/>
				</Field.Row>
				<Field.Error>{error}</Field.Error>
			</Field>
		),
		[className, label, t, name, required, mappedOptions],
	);
};

type CustomFieldsAssemblerProps = {
	customFields: ICustomField[];
	register: unknown;
	errors: unknown;
};

const CustomFieldsAssembler = ({ customFields, register, errors }: CustomFieldsAssemblerProps): ReactElement => {
	const customFieldsFieldsList = customFields
		.filter((customField) => customField.type === 'select' || customField.type === 'text' || !customField.type)
		.map((customField) => {
			const extraProps = {
				key: customField._id,
				name: customField.label,
				error: errors?.[customField._id],
				register,
			};

			return customField.type === 'select' ? <CustomSelect {...extraProps} /> : <CustomTextInput {...extraProps} />;
		});
	return <>{customFieldsFieldsList}</>;
};

export default CustomFieldsAssembler;
