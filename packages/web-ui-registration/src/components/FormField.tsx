import { Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

type FormFieldProps = {
    label: string;
    required?: boolean;
    htmlFor: string;
    children: ReactNode;
    error?: string;
    errorId: string;
};

export const FormField = ({ label, required = false, htmlFor, children, error, errorId }: FormFieldProps): ReactElement => (
    <Field>
        <FieldLabel required={required} htmlFor={htmlFor}>
            {label}
        </FieldLabel>
        <FieldRow>{children}</FieldRow>
        {error && (
            <FieldError role='alert' id={errorId}>
                {error}
            </FieldError>
        )}
    </Field>
);
