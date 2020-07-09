import { useCallback, useReducer, useMemo } from 'react';

import { capitalize } from '../helpers/capitalize';

const reduceForm = (state, morphState) => morphState(state);

const initForm = (initialValues) =>
	Object.entries(initialValues)
		.reduce((form, [fieldName, initialValue]) => ({
			...form,
			values: {
				...form.values,
				[fieldName]: initialValue,
			},
			initialValues: {
				...form.initialValues,
				[fieldName]: initialValue,
			},
		}), {
			hasUnsavedChanges: false,
		});

const valueChanged = (fieldName, newValue) => (form) => {
	const initialValue = form.initialValues[fieldName];
	return {
		...form,
		values: {
			...form.values,
			[fieldName]: newValue,
		},
		hasUnsavedChanges: JSON.stringify(newValue) !== JSON.stringify(initialValue),
	};
};

const formReset = () => (form) => ({
	...form,
	values: {
		...form.initialValues,
	},
	hasUnsavedChanges: false,
});

export const useForm = (initialValues, onChange = () => {}) => {
	const [form, update] = useReducer(reduceForm, initialValues, initForm);

	const reset = useCallback(() => {
		update(formReset());
	}, []);

	const handlers = useMemo(() => Object.entries(initialValues).reduce((handlers, [fieldName, initialValue]) => ({
		...handlers,
		[`handle${ capitalize(fieldName) }`]: (event) => {
			const getValue = (e) => {
				if (typeof initialValue === 'boolean') {
					return e?.currentTarget?.checked;
				}

				if (typeof e?.currentTarget?.value !== 'undefined') {
					return e.currentTarget.value;
				}

				return e;
			};
			const newValue = getValue(event);
			update(valueChanged(fieldName, newValue));
			onChange({ initialValue, value: newValue, key: fieldName });
		},
	}), {}), [initialValues, onChange]);

	return {
		values: form.values,
		handlers,
		reset,
		hasUnsavedChanges: form.hasUnsavedChanges,
	};
};
