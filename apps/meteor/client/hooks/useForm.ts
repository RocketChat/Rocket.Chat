import { capitalize } from '@rocket.chat/string-helpers';
import { useCallback, useReducer, useMemo, ChangeEvent } from 'react';

type Field = {
	name: string;
	currentValue: unknown;
	initialValue: unknown;
	changed: boolean;
};

type FormState<Values extends Record<string, unknown>> = {
	fields: Field[];
	values: Values;
	hasUnsavedChanges: boolean;
};

type FormAction<Values extends Record<string, unknown>> = {
	(prevState: FormState<Values>): FormState<Values>;
};

const reduceForm = <Values extends Record<string, unknown>>(state: FormState<Values>, action: FormAction<Values>): FormState<Values> =>
	action(state);

const initForm = <Values extends Record<string, unknown>>(initialValues: Values): FormState<Values> => {
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
		values: { ...initialValues },
		hasUnsavedChanges: false,
	};
};

const valueChanged =
	<Values extends Record<string, unknown>>(fieldName: string, newValue: unknown): FormAction<Values> =>
	(state: FormState<Values>): FormState<Values> => {
		let { fields } = state;
		const field = fields.find(({ name }) => name === fieldName);

		if (!field || field.currentValue === newValue) {
			return state;
		}

		const newField = {
			...field,
			currentValue: newValue,
			changed: JSON.stringify(newValue) !== JSON.stringify(field.initialValue),
		};

		fields = state.fields.map((field) => {
			if (field.name === fieldName) {
				return newField;
			}

			return field;
		});

		return {
			...state,
			fields,
			values: {
				...state.values,
				[newField.name]: newField.currentValue,
			},
			hasUnsavedChanges: newField.changed || fields.some((field) => field.changed),
		};
	};

const formCommitted =
	<Values extends Record<string, unknown>>(): FormAction<Values> =>
	(state: FormState<Values>): FormState<Values> => ({
		...state,
		fields: state.fields.map((field) => ({
			...field,
			initialValue: field.currentValue,
			changed: false,
		})),
		hasUnsavedChanges: false,
	});

const formReset =
	<Values extends Record<string, unknown>>(): FormAction<Values> =>
	(state: FormState<Values>): FormState<Values> => ({
		...state,
		fields: state.fields.map((field) => ({
			...field,
			currentValue: field.initialValue,
			changed: false,
		})),
		values: state.fields.reduce(
			(values, field) => ({
				...values,
				[field.name]: field.initialValue,
			}),
			{} as Values,
		),
		hasUnsavedChanges: false,
	});

const isChangeEvent = (x: any): x is ChangeEvent =>
	(typeof x === 'object' || typeof x === 'function') && typeof x?.currentTarget !== 'undefined';

const getValue = (eventOrValue: ChangeEvent | unknown): unknown => {
	if (!isChangeEvent(eventOrValue)) {
		return eventOrValue;
	}

	const target = eventOrValue.currentTarget;

	if (target instanceof HTMLTextAreaElement) {
		return target.value;
	}

	if (target instanceof HTMLSelectElement) {
		return target.value;
	}

	if (!(target instanceof HTMLInputElement)) {
		return undefined;
	}

	if (target.type === 'checkbox' || target.type === 'radio') {
		return target.checked;
	}

	return target.value;
};

/**
 * @deprecated prefer react-hook-form's `useForm`
 */
export const useForm = <
	Reducer extends (
		state: FormState<Record<string, unknown>>,
		action: FormAction<Record<string, unknown>>,
	) => FormState<Record<string, unknown>>,
>(
	initialValues: Parameters<Reducer>[0]['values'],
	onChange: (...args: unknown[]) => void = (): void => undefined,
): {
	values: Parameters<Reducer>[0]['values'];
	handlers: Record<string, (eventOrValue: ChangeEvent | unknown) => void>;
	hasUnsavedChanges: boolean;
	commit: () => void;
	reset: () => void;
} => {
	const [state, dispatch] = useReducer(reduceForm, initialValues, initForm);

	const commit = useCallback(() => {
		dispatch(formCommitted());
	}, []);

	const reset = useCallback(() => {
		dispatch(formReset());
	}, []);

	const handlers = useMemo<Record<string, (eventOrValue: ChangeEvent | unknown) => void>>(
		() =>
			state.fields.reduce(
				(handlers, { name, initialValue }) => ({
					...handlers,
					[`handle${capitalize(name)}`]: (eventOrValue: ChangeEvent | unknown): void => {
						const newValue = getValue(eventOrValue);
						dispatch(valueChanged(name, newValue));
						onChange({
							initialValue,
							value: newValue,
							key: name,
							values: state.values,
						});
					},
				}),
				{},
			),
		[onChange, state.fields, state.values],
	);

	return {
		handlers,
		values: state.values,
		hasUnsavedChanges: state.hasUnsavedChanges,
		commit,
		reset,
	};
};
