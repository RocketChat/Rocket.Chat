import { useCallback, useReducer, useMemo, SyntheticEvent } from 'react';

import { capitalize } from '../helpers/capitalize';

type Field = {
	name: string;
	currentValue: unknown;
	initialValue: unknown;
	changed: boolean;
};

type FormState = {
	fields: Field[];
	hasUnsavedChanges: boolean;
};

type FormAction = {
	(prevState: FormState): FormState;
};

type UseFormReturnType = {
	values: Record<string, unknown>;
	handlers: Record<string, (eventOrValue: SyntheticEvent<HTMLInputElement> | unknown) => void>;
	hasUnsavedChanges: boolean;
	reset: () => void;
};

const reduceForm = (prevState: FormState, action: FormAction): FormState =>
	action(prevState);

const initForm = (initialValues: Record<string, unknown>): FormState => {
	const fields = [];

	for (const [fieldName, initialValue] of Object.entries(initialValues)) {
		fields.push({
			name: fieldName,
			currentValue: initialValue,
			initialValue,
			changed: false,
		});
	}

	return {
		fields,
		hasUnsavedChanges: false,
	};
};

const valueChanged = (fieldName: string, newValue: unknown): FormAction =>
	(prevState: FormState): FormState => {
		const prevField = prevState.fields.find(({ name }) => name === fieldName);

		if (!prevField || prevField.currentValue === newValue) {
			return prevState;
		}

		const newField = {
			...prevField,
			currentValue: newValue,
			changed: JSON.stringify(newValue) !== JSON.stringify(prevField.initialValue),
		};

		if (newField.changed === prevField.changed) {
			return {
				...prevState,
				fields: prevState.fields.map((field) => (field.name === fieldName ? newField : field)),
			};
		}

		if (newField.changed) {
			return {
				...prevState,
				fields: prevState.fields.map((field) => (field.name === fieldName ? newField : field)),
				hasUnsavedChanges: true,
			};
		}

		const fields = prevState.fields.map((field) => (field.name === fieldName ? newField : field));
		const hasUnsavedChanges = fields.reduce<boolean>((newHasUnsavedChanges, field) => newHasUnsavedChanges || field.changed, false);

		return {
			...prevState,
			fields,
			hasUnsavedChanges,
		};
	};

const formReset = (): FormAction =>
	(prevState: FormState): FormState => ({
		...prevState,
		fields: prevState.fields.map((field) => ({
			...field,
			currentValue: field.initialValue,
			changed: false,
		})),
		hasUnsavedChanges: false,
	});

export const useForm = (
	initialValues: Record<string, unknown>,
	onChange: ((...args: unknown[]) => void) = (): void => undefined,
): UseFormReturnType => {
	const [formState, dispatch] = useReducer(reduceForm, initialValues, initForm);

	const reset = useCallback(() => {
		dispatch(formReset());
	}, []);

	const handlers = useMemo(() => Object.entries(initialValues).reduce((handlers, [fieldName, initialValue]) => ({
		...handlers,
		[`handle${ capitalize(fieldName) }`]: (eventOrValue: SyntheticEvent<HTMLInputElement> | unknown): void => {
			const getValue = (eventOrValue: SyntheticEvent<HTMLInputElement> | unknown): unknown => {
				if (typeof initialValue === 'boolean') {
					return (eventOrValue as SyntheticEvent<HTMLInputElement>)?.currentTarget?.checked;
				}

				if (typeof (eventOrValue as SyntheticEvent<HTMLInputElement>)?.currentTarget?.value !== 'undefined') {
					return (eventOrValue as SyntheticEvent<HTMLInputElement>).currentTarget.value;
				}

				return eventOrValue;
			};
			const newValue = getValue(eventOrValue);
			dispatch(valueChanged(fieldName, newValue));
			onChange({ initialValue, value: newValue, key: fieldName });
		},
	}), {}), [initialValues, onChange]);

	const values = useMemo(
		() => formState.fields.reduce((values, field) => ({ ...values, [field.name]: field.currentValue }), {}),
		[formState],
	);

	const { hasUnsavedChanges } = formState;

	return {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	};
};
