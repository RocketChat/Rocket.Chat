import React, { useMemo, useEffect, useState } from 'react';
import { TextInput, Select, Field } from '@rocket.chat/fuselage';

import { useSetting } from '../contexts/SettingsContext';
import { useForm } from '../hooks/useForm';
import { useTranslation } from '../contexts/TranslationContext';
import { capitalize } from '../helpers/capitalize';

const CustomTextInput = ({ name, required, minLength, maxLength, setState, state, className }) => {
	const t = useTranslation();
	const verify = useMemo(() => {
		const error = [];
		if (!state && required) { error.push(t('Field_required')); }
		if (state.length < minLength && state.length > 0) { error.push(t('Min_length_is', minLength)); }
		return error.join(', ');
	}, [state, required, minLength, t]);

	return useMemo(() => <Field className={className}>
		<Field.Label>{t(name)}</Field.Label>
		<Field.Row>
			<TextInput name={name} error={verify} maxLength={maxLength} flexGrow={1} value={state} required={required} onChange={(e) => setState(e.currentTarget.value)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>, [name, verify, maxLength, state, required, setState, className]);
};

const CustomSelect = ({ name, required, options, setState, state, className }) => {
	const t = useTranslation();
	const mappedOptions = useMemo(() => Object.values(options).map((value) => [value, value]), [options]);
	const verify = useMemo(() => (!state.length && required ? t('Field_required') : ''), [required, state.length, t]);

	return useMemo(() => <Field className={className}>
		<Field.Label>{t(name)}</Field.Label>
		<Field.Row>
			<Select name={name} error={verify} flexGrow={1} value={state} options={mappedOptions} required={required} onChange={(val) => setState(val)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>, [name, verify, state, mappedOptions, required, setState, className]);
};

const CustomFieldsAssembler = ({ formValues, formHandlers, customFields, ...props }) => Object.entries(customFields).map(([key, value]) => {
	const extraProps = {
		key,
		name: key,
		setState: formHandlers[`handle${ capitalize(key) }`],
		state: formValues[key],
		...value,
	};

	if (value.type === 'select') {
		return <CustomSelect {...extraProps} {...props}/>;
	}

	if (value.type === 'text') {
		return <CustomTextInput {...extraProps} {...props}/>;
	}

	return null;
});

export default function CustomFieldsForm({ customFieldsData, setCustomFieldsData, onLoadFields = () => {}, ...props }) {
	const customFieldsJson = useSetting('Accounts_CustomFields');

	const [customFields] = useState(() => {
		try {
			return JSON.parse(customFieldsJson || '{}');
		} catch {
			return {};
		}
	});

	const hasCustomFields = Boolean(Object.values(customFields).length);
	const defaultFields = useMemo(() => Object.entries(customFields).reduce((data, [key, value]) => { data[key] = value.defaultValue ?? ''; return data; }, {}), []);

	const { values, handlers } = useForm({ ...defaultFields, ...customFieldsData });

	useEffect(() => {
		onLoadFields(hasCustomFields);
		if (hasCustomFields) {
			setCustomFieldsData(values);
		}
	// TODO: remove stringify. Is needed to avoid infinite rendering
	}, [JSON.stringify(values)]);

	if (!hasCustomFields) {
		return null;
	}

	return <CustomFieldsAssembler formValues={values} formHandlers={handlers} customFields={customFields} {...props}/>;
}
