import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useFormState } from 'react-hook-form';

type UseFieldErrorProps<TFieldValues extends FieldValues> = {
	control: Control<TFieldValues>;
	name: FieldPath<TFieldValues> | FieldPath<TFieldValues>[];
};

export const useFieldError = <TFieldValues extends FieldValues>({ control, name }: UseFieldErrorProps<TFieldValues>) => {
	const names = Array.isArray(name) ? name : [name];
	const formState = useFormState<TFieldValues>({ control, name });
	return names.map((name) => control.getFieldState(name, formState).error);
};
