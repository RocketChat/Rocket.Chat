import { Field, FieldLabel, FieldRow, FieldError, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import type { FieldError as FieldErrorType, UseFormRegisterReturn } from 'react-hook-form';

type FormFieldInputProps = {
    label: string;
    fieldId: string;
    required?: boolean;
    error?: FieldErrorType;
    placeholder?: string;
    register: UseFormRegisterReturn;
    type?: 'text' | 'textarea';
};

export const FormFieldInput = ({
    label,
    fieldId,
    required = false,
    error,
    placeholder,
    register,
    type = 'text',
}: FormFieldInputProps): ReactElement => {
    const InputComponent = type === 'textarea' ? TextAreaInput : TextInput;

    return (
        <Field>
            <FieldLabel required={required} htmlFor={fieldId}>
                {label}
            </FieldLabel>
            <FieldRow>
                <InputComponent
                    {...register}
                    error={error?.message}
                    aria-required={required ? 'true' : 'false'}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={`${fieldId}-error`}
                    id={fieldId}
                    placeholder={placeholder}
                />
            </FieldRow>
            {error && (
                <FieldError role='alert' id={`${fieldId}-error`}>
                    {error.message}
                </FieldError>
            )}
        </Field>
    );
};
