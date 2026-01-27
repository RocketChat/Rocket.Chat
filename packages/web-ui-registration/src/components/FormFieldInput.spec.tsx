import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { FormFieldInput } from './FormFieldInput';

const mockRegister = {
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
    name: 'testField',
};

const defaultAppRoot = mockAppRoot().build();

describe('FormFieldInput', () => {
    it('should render text input with label', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render textarea when type is textarea', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' register={mockRegister} type='textarea' />,
            { wrapper: defaultAppRoot },
        );

        const textarea = screen.getByLabelText('Test Field');
        expect(textarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('should mark field as required', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' required register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should not mark field as required when not specified', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-required', 'false');
    });

    it('should display error message', () => {
        const error = { type: 'required', message: 'This field is required' };

        render(
            <FormFieldInput label='Test Field' fieldId='test-id' error={error as any} register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByText('This field is required')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not display error when no error provided', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should set aria-invalid to true when error exists', () => {
        const error = { type: 'required', message: 'Error' };

        render(
            <FormFieldInput label='Test Field' fieldId='test-id' error={error as any} register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('should apply placeholder', () => {
        render(
            <FormFieldInput label='Test Field' fieldId='test-id' placeholder='Enter text' register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should have proper aria-describedby for error', () => {
        const error = { type: 'required', message: 'Error' };

        render(
            <FormFieldInput label='Test Field' fieldId='test-id' error={error as any} register={mockRegister} />,
            { wrapper: defaultAppRoot },
        );

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', 'test-id-error');
        expect(screen.getByRole('alert')).toHaveAttribute('id', 'test-id-error');
    });
});
