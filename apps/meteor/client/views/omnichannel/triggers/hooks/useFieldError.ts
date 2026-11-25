import type { Control, FieldError, FieldPath, FieldValues } from 'react-hook-form';
import { get, useFormState } from 'react-hook-form';

type UseFieldErrorProps<TFieldValues extends FieldValues> = {
	control: Control<TFieldValues>;
	name: FieldPath<TFieldValues> | FieldPath<TFieldValues>[];
};

export const useFieldError = <TFieldValues extends FieldValues>({ control, name }: UseFieldErrorProps<TFieldValues>) => {
	const names = Array.isArray(name) ? name : [name];
	const { errors } = useFormState<TFieldValues>({ control, name });
	return names.map((name): FieldError | undefined => {
		const error: FieldError | undefined = get(errors, name);
		return error;
	});
};
