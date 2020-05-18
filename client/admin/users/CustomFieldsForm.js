import React, { useMemo, useEffect, useState } from 'react';
import { TextInput, Select, Field } from '@rocket.chat/fuselage';

import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';

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
	useEffect(() => {
		setState(state);
	}, []);

	return useMemo(() => <Field>
		<Field.Label>{name}</Field.Label>
		<Field.Row>
			<Select name={name} error={verify} flexGrow={1} value={state} options={mappedOptions} required={required} onChange={(val) => setState(val)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>, [name, verify, state, required, JSON.stringify(mappedOptions)]);
};

const CustomFieldsAssembler = ({ customFields, didUpdate, customFieldsData, setCustomFieldsData, ...props }) => Object.entries(customFields).map(([key, value]) => {
	const [state, setState] = useState((customFieldsData && customFieldsData[key]) ?? value.defaultValue ?? '');
	useEffect(() => {
		if (didUpdate) {
			setCustomFieldsData({ ...customFieldsData, [key]: state });
		}
	}, [state]);
	return value.type === 'text'
		? <CustomTextInput key={key} name={key} {...value} setState={setState} state={state} {...props}/>
		: <CustomSelect key={key} name={key} {...value} setState={setState} state={state} {...props}/>;
});

export default function CustomFieldsForm({ customFieldsData, setCustomFieldsData, ...props }) {
	const fields = useSetting('Accounts_CustomFields');

	const parsedFields = useMemo(() => JSON.parse(fields), [fields]);

	const [didUpdate, setDidUpdate] = useState(false);

	useEffect(() => {
		setDidUpdate(true);
		if (!Object.values(customFieldsData).length) {
			const initialData = Object.entries(parsedFields).reduce((data, [key, value]) => { data[key] = value.defaultValue ?? ''; return data; }, {});
			setCustomFieldsData(initialData);
		}
	}, []);

	return <CustomFieldsAssembler didUpdate={didUpdate} customFields={parsedFields} customFieldsData={customFieldsData} setCustomFieldsData={setCustomFieldsData} {...props}/>;
}
