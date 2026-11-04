import type { ComponentChild } from 'preact';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

import { FormField } from '../../Form';

export const ErrorsContext = createContext<Record<string, string>>({});

type InputFieldProps = { label?: string; hint?: string; actionId: string; children: ComponentChild };

const InputField = ({ label, hint, actionId, children }: InputFieldProps) => {
	const errors = useContext(ErrorsContext);

	return (
		<FormField label={label} description={hint} error={errors[actionId]}>
			{children}
		</FormField>
	);
};

export default InputField;
