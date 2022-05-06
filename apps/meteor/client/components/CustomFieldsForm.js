import { TextInput, Select, Field } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect, useState } from 'react';

import { useComponentDidUpdate } from '../hooks/useComponentDidUpdate';
import { useForm } from '../hooks/useForm';

const CustomTextInput = ({ label, name, required, minLength, maxLength, setState, state, className, setCustomFieldsError = () => [] }) => {
	const t = useTranslation();

	const [inputError, setInputError] = useState('');

	const verify = useMemo(() => {
		const errors = [];
		if (!state && required) {
			errors.push(t('The_field_is_required', label || name));
		}

		if (state.length < minLength && state.length > 0) {
			errors.push(t('Min_length_is', minLength));
		}

		return errors.join(', ');
	}, [state, required, minLength, t, label, name]);

	useEffect(() => {
		setCustomFieldsError((oldErrors) => (verify ? [...oldErrors, { name }] : oldErrors.filter((item) => item.name !== name)));
	}, [name, setCustomFieldsError, verify]);

	useComponentDidUpdate(() => {
		setInputError(verify);
	}, [verify]);

	return useMemo(
		() => (
			<Field className={className}>
				<Field.Label>
					{label || t(name)}
					{required && '*'}
				</Field.Label>
				<Field.Row>
					<TextInput
						name={name}
						error={inputError}
						maxLength={maxLength}
						flexGrow={1}
						value={state}
						onChange={(e) => setState(e.currentTarget.value)}
					/>
				</Field.Row>
				<Field.Error>{inputError}</Field.Error>
			</Field>
		),
		[className, label, t, name, required, inputError, maxLength, state, setState],
	);
};

const CustomSelect = ({ label, name, required, options = {}, setState, state, className, setCustomFieldsError = () => [] }) => {
	const t = useTranslation();
	const [selectError, setSelectError] = useState('');

	const mappedOptions = useMemo(() => Object.values(options).map((value) => [value, value]), [options]);
	const verify = useMemo(
		() => (!state.length && required ? t('The_field_is_required', label || name) : ''),
		[name, label, required, state.length, t],
	);

	useEffect(() => {
		setCustomFieldsError((oldErrors) => (verify ? [...oldErrors, { name }] : oldErrors.filter((item) => item.name !== name)));
	}, [name, setCustomFieldsError, verify]);

	useComponentDidUpdate(() => {
		setSelectError(verify);
	}, [verify]);

	return useMemo(
		() => (
			<Field className={className}>
				<Field.Label>
					{label || t(name)}
					{required && '*'}
				</Field.Label>
				<Field.Row>
					<Select name={name} error={selectError} flexGrow={1} value={state} options={mappedOptions} onChange={(val) => setState(val)} />
				</Field.Row>
				<Field.Error>{selectError}</Field.Error>
			</Field>
		),
		[className, label, t, name, required, selectError, state, mappedOptions, setState],
	);
};

const CustomFieldsAssembler = ({ formValues, formHandlers, customFields, ...props }) =>
	Object.entries(customFields).map(([key, value]) => {
		const extraProps = {
			key,
			name: key,
			setState: formHandlers[`handle${capitalize(key)}`],
			state: formValues[key],
			...value,
		};

		if (value.type === 'select') {
			return <CustomSelect {...extraProps} {...props} />;
		}

		if (value.type === 'text') {
			return <CustomTextInput {...extraProps} {...props} />;
		}

		return null;
	});

export default function CustomFieldsForm({ jsonCustomFields, customFieldsData, setCustomFieldsData, onLoadFields = () => {}, ...props }) {
	const accountsCustomFieldsJson = useSetting('Accounts_CustomFields');

	const [customFields] = useState(() => {
		try {
			return jsonCustomFields || JSON.parse(accountsCustomFieldsJson || '{}');
		} catch {
			return {};
		}
	});

	const hasCustomFields = Boolean(Object.values(customFields).length);
	const defaultFields = useMemo(
		() =>
			Object.entries(customFields).reduce((data, [key, value]) => {
				data[key] = value.defaultValue ?? '';
				return data;
			}, {}),
		[customFields],
	);

	const { values, handlers } = useForm({ ...defaultFields, ...customFieldsData });

	useEffect(() => {
		onLoadFields(hasCustomFields);
		if (hasCustomFields) {
			setCustomFieldsData(values);
		}
	}, [hasCustomFields, onLoadFields, setCustomFieldsData, values]);

	if (!hasCustomFields) {
		return null;
	}

	return <CustomFieldsAssembler formValues={values} formHandlers={handlers} customFields={customFields} {...props} />;
}
