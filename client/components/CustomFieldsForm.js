import React, { useMemo, useEffect, useState } from 'react';

import { useSetting } from '../contexts/SettingsContext';
import { useForm } from '../hooks/useForm';
import CustomFieldsAssembler from './CustomFieldsAssembler';

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
