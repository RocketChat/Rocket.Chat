import { capitalize } from '@rocket.chat/string-helpers';
import { useCallback, useReducer, useMemo, ChangeEvent } from 'react';

type Field = {
	name: string;
	currentValue: unknown;
	initialValue: unknown;
	changed: boolean;
};

type FormState = {
	fields: Field[];
	values: Record<string, unknown>;
	hasUnsavedChanges: boolean;
};

type FormAction = {
	(prevState: FormState): FormState;
};

type UseFormReturnType = {
	values: Record<string, unknown>;
	handlers: Record<string, (eventOrValue: ChangeEvent | unknown) => void>;
	hasUnsavedChanges: boolean;
	commit: () => void;
	reset: () => void;
};

const reduceForm = (state: FormState, action: FormAction): FormState => action(state);

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
		values: { ...initialValues },
		hasUnsavedChanges: false,
	};
};

const valueChanged =
	(fieldName: string, newValue: unknown): FormAction =>
	(state: FormState): FormState => {
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
	(): FormAction =>
	(state: FormState): FormState => ({
		...state,
		fields: state.fields.map((field) => ({
			...field,
			initialValue: field.currentValue,
			changed: false,
		})),
		hasUnsavedChanges: false,
	});

const formReset =
	(): FormAction =>
	(state: FormState): FormState => ({
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
			{},
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

export const useForm = (
	initialValues: Record<string, unknown>,
	onChange: (...args: unknown[]) => void = (): void => undefined,
): UseFormReturnType => {
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
						});
					},
				}),
				{},
			),
		[onChange, state.fields],
	);

	return {
		handlers,
		values: state.values,
		hasUnsavedChanges: state.hasUnsavedChanges,
		commit,
		reset,
	};
};
