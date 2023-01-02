import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect } from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import CustomFieldsAdditionalForm from './CustomFieldsAdditionalForm';

const getInitialValues = (data) => ({
	type: data.type || 'input',
	required: !!data.required,
	defaultValue: data.defaultValue ?? '',
	options: data.options || '',
	public: !!data.public,
});

const checkInvalidOptions = (value) => {
	if (!value || value.trim() === '') {
		return false;
	}

	return value.split(',').every((v) => /^[a-zA-Z0-9-_ ]+$/.test(v));
};

const CustomFieldsAdditionalFormContainer = ({ data = {}, state, onChange, className }) => {
	const t = useTranslation();

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialValues(data));

	const errors = useMemo(
		() => ({
			optionsError: checkInvalidOptions(values.options) ? t('error-invalid-value') : undefined,
		}),
		[t, values.options],
	);

	const hasError = useMemo(() => !!Object.values(errors).filter(Boolean).length, [errors]);

	useEffect(() => {
		onChange({ data: values, hasError, hasUnsavedChanges });
	}, [hasError, hasUnsavedChanges, onChange, values]);

	return <CustomFieldsAdditionalForm values={values} handlers={handlers} state={state} className={className} errors={errors} />;
};

export default CustomFieldsAdditionalFormContainer;
