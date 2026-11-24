import type { ComponentChild } from 'preact';
import { createContext } from 'preact';
import { useContext, useEffect, useId, useRef } from 'preact/hooks';

import { FormField } from '../../Form';

export const ErrorsContext = createContext<Record<string, string>>({});

type InputFieldProps = { label?: string; hint?: string; actionId: string; children: ComponentChild };

const InputField = ({ label, hint, actionId, children }: InputFieldProps) => {
	const errors = useContext(ErrorsContext);
	const error = errors[actionId];
	const errorId = useId();
	const wrapper = useRef<HTMLDivElement>(null);

	// Every input type, plain text, select and date, gets the link without each one taking aria props.
	useEffect(() => {
		const control = wrapper.current?.querySelector('input, select, textarea');
		if (!control) {
			return;
		}
		if (error) {
			control.setAttribute('aria-invalid', 'true');
			control.setAttribute('aria-describedby', errorId);
		} else {
			control.removeAttribute('aria-invalid');
			control.removeAttribute('aria-describedby');
		}
	});

	return (
		<div ref={wrapper}>
			<FormField label={label} description={hint} error={error} errorId={errorId}>
				{children}
			</FormField>
		</div>
	);
};

export default InputField;
