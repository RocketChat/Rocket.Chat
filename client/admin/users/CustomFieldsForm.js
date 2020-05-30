import React, { useMemo, useEffect } from 'react';
import { TextInput, Select, Field, Divider, Box } from '@rocket.chat/fuselage';

import { useSetting } from '../../contexts/SettingsContext';
import { useForm } from '../../hooks/useForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { capitalize } from '../../helpers/capitalize';

const CustomTextInput = (props) => {
	const t = useTranslation();
	const { name, required, minLength, maxLength, setState, state } = props;
	const verify = useMemo(() => {
		const error = [];
		if (!state && required) { error.push(t('Field_required')); }
		if (state.length < minLength) { error.push(t('Min_length_is', minLength)); }
		return error.join(', ');
	}, [required, minLength, maxLength, state]);

	return useMemo(() => <Field>
		<Field.Label>{name}</Field.Label>
		<Field.Row>
			<TextInput name={name} error={verify} maxLength={maxLength} flexGrow={1} value={state} required={required} onChange={(e) => setState(e.currentTarget.value)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>, [name, verify, state, required]);
};

const CustomSelect = (props) => {
	const t = useTranslation();
	const { name, required, options, setState, state } = props;
	const mappedOptions = useMemo(() => Object.values(options).map((value) => [value, value]), [...options]);
	const verify = useMemo(() => (!state.length && required ? t('Field_required') : ''), [required, state]);

	return useMemo(() => <Field>
		<Field.Label>{name}</Field.Label>
		<Field.Row>
			<Select name={name} error={verify} flexGrow={1} value={state} options={mappedOptions} required={required} onChange={(val) => setState(val)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>, [name, verify, state, required, JSON.stringify(mappedOptions)]);
};

const CustomFieldsAssembler = ({ formValues, formHandlers, customFields, ...props }) => Object.entries(customFields).map(([key, value]) => {
	const extraProps = {
		key,
		name: key,
		setState: formHandlers[`handle${ capitalize(key) }`],
		state: formValues[key],
		...value,
	};
	return value.type === 'text'
		? <CustomTextInput {...extraProps} {...props}/>
		: <CustomSelect {...extraProps} {...props}/>;
});

export default function CustomFieldsForm({ customFieldsData, setCustomFieldsData, ...props }) {
	const t = useTranslation();

	const customFieldsJson = useSetting('Accounts_CustomFields');

	const customFields = useMemo(() => JSON.parse(customFieldsJson || '{}'), []);

	if (!Object.values(customFields).length) {
		return null;
	}

	const defaultFields = useMemo(() => Object.entries(customFields).reduce((data, [key, value]) => { data[key] = value.defaultValue ?? ''; return data; }, {}), []);

	const { values, handlers } = useForm({ ...defaultFields, ...customFieldsData });

	useEffect(() => {
		setCustomFieldsData(values);
	}, [JSON.stringify(values)]);

	return <>
		<Divider />
		<Box fontScale='s2'>{t('Custom_Fields')}</Box>
		<CustomFieldsAssembler formValues={values} formHandlers={handlers} customFields={customFields} {...props}/>
	</>;
}
