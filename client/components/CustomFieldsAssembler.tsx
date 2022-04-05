import { TextInput, Select, Field, SelectOption } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import React, { useMemo, useEffect, useState, FormEvent, ReactElement } from 'react';

import { ILivechatCustomField } from '../../definition/ILivechatCustomField';
import { useTranslation, TranslationKey } from '../contexts/TranslationContext';
import { useComponentDidUpdate } from '../hooks/useComponentDidUpdate';

interface ICustomFieldComponentProps {
	label?: string;
	name: string;
	required?: boolean;
	setState: (value: string) => void;
	state: string;
	className?: string;
	setCustomFieldsError?: (errors: (oldErrors: { name: string }[]) => { name: string }[]) => void;
}

interface ICustomTextInputProps extends ICustomFieldComponentProps {
	minLength?: number;
	maxLength?: number;
}

interface ICustomSelectProps extends ICustomFieldComponentProps {
	options?: string[];
}

const CustomTextInput = ({
	label,
	name,
	required,
	minLength,
	maxLength,
	setState,
	state,
	className,
	setCustomFieldsError,
}: ICustomTextInputProps): ReactElement => {
	const t = useTranslation();

	const [inputError, setInputError] = useState('');

	const verify = useMemo(() => {
		const errors = [];
		if (!state && required) {
			errors.push(t('The_field_is_required', label || name));
		}

		if (minLength && state.length < minLength && state.length > 0) {
			errors.push(t('Min_length_is', minLength));
		}

		return errors.join(', ');
	}, [state, required, minLength, t, label, name]);

	useEffect(() => {
		setCustomFieldsError?.((oldErrors: { name: string }[]) =>
			verify ? [...oldErrors, { name }] : oldErrors.filter((item) => item.name !== name),
		);
	}, [name, setCustomFieldsError, verify]);

	useComponentDidUpdate(() => {
		setInputError(verify);
	}, [verify]);

	return useMemo(
		() => (
			<Field className={className}>
				<Field.Label>
					{label || t(name as TranslationKey)}
					{required && '*'}
				</Field.Label>
				<Field.Row>
					<TextInput
						name={name}
						error={inputError}
						maxLength={maxLength}
						flexGrow={1}
						value={state}
						onChange={(e: FormEvent<HTMLInputElement>): void => setState(e.currentTarget.value)}
					/>
				</Field.Row>
				<Field.Error>{inputError}</Field.Error>
			</Field>
		),
		[className, label, t, name, required, inputError, maxLength, state, setState],
	);
};

const CustomSelect = ({
	label,
	name,
	required,
	options = [],
	setState,
	state,
	className,
	setCustomFieldsError,
}: ICustomSelectProps): ReactElement => {
	const t = useTranslation();
	const [selectError, setSelectError] = useState('');

	const mappedOptions = useMemo(() => Object.values(options).map((value): SelectOption => [value, value]), [options]);
	const verify = useMemo(
		() => (!state.length && required ? t('The_field_is_required', label || name) : ''),
		[name, label, required, state.length, t],
	);

	useEffect(() => {
		setCustomFieldsError?.((oldErrors) => (verify ? [...oldErrors, { name }] : oldErrors.filter((item) => item.name !== name)));
	}, [name, setCustomFieldsError, verify]);

	useComponentDidUpdate(() => {
		setSelectError(verify);
	}, [verify]);

	return useMemo(
		() => (
			<Field className={className}>
				<Field.Label>
					{label || t(name as TranslationKey)}
					{required && '*'}
				</Field.Label>
				<Field.Row>
					<Select
						name={name}
						error={selectError}
						flexGrow={1}
						value={state}
						options={mappedOptions}
						onChange={(val): void => setState(val)}
					/>
				</Field.Row>
				<Field.Error>{selectError}</Field.Error>
			</Field>
		),
		[className, label, t, name, required, selectError, state, mappedOptions, setState],
	);
};

type CustomFieldsAssemblerProps = {
	formValues: Record<string, string>;
	formHandlers: Record<string, (eventOrValue: unknown) => void>;
	customFields: ILivechatCustomField[];
};

const CustomFieldsAssembler = ({ formValues, formHandlers, customFields, ...props }: CustomFieldsAssemblerProps): ReactElement[] =>
	Object.entries(customFields)
		.filter((customField) => customField[1].type === 'select' || customField[1].type === 'text')
		.map(([key, value]) => {
			const extraProps = {
				key,
				name: key,
				setState: formHandlers[`handle${capitalize(key)}`],
				state: formValues[key],
				...value,
			};

			return value.type === 'select' ? <CustomSelect {...extraProps} {...props} /> : <CustomTextInput {...extraProps} {...props} />;
		});

export default CustomFieldsAssembler;
