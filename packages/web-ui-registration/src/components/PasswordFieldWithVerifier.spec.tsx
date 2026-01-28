import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { PasswordFieldWithVerifier } from './PasswordFieldWithVerifier';

const mockPasswordRegister = {
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
    name: 'password',
};

const mockConfirmRegister = {
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
    name: 'passwordConfirmation',
};

const defaultAppRoot = mockAppRoot()
    .withTranslations('en', 'core', {
        'registration.component.form.password': 'Password',
        'registration.component.form.confirmPassword': 'Confirm password',
        Create_a_password: 'Create a password',
        Confirm_password: 'Confirm your password',
    })
    .withSetting('Accounts_Password_Policy_Enabled', false)
    .build();

describe('PasswordFieldWithVerifier', () => {
    it('should render password field', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordRegister={mockPasswordRegister}
                password=''
                passwordIsValid={false}
                requiresPasswordConfirmation={false}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    });

    it('should render password confirmation when required', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordConfirmationId='confirm-id'
                passwordRegister={mockPasswordRegister}
                passwordConfirmationRegister={mockConfirmRegister}
                password='test123'
                passwordIsValid={true}
                requiresPasswordConfirmation={true}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should NOT render password confirmation when not required', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordRegister={mockPasswordRegister}
                password='test123'
                passwordIsValid={true}
                requiresPasswordConfirmation={false}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it('should disable confirmation field when password is invalid', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordConfirmationId='confirm-id'
                passwordRegister={mockPasswordRegister}
                passwordConfirmationRegister={mockConfirmRegister}
                password='weak'
                passwordIsValid={false}
                requiresPasswordConfirmation={true}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    });

    it('should enable confirmation field when password is valid', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordConfirmationId='confirm-id'
                passwordRegister={mockPasswordRegister}
                passwordConfirmationRegister={mockConfirmRegister}
                password='StrongPassword123!'
                passwordIsValid={true}
                requiresPasswordConfirmation={true}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByLabelText(/confirm password/i)).not.toBeDisabled();
    });

    it('should display password error', () => {
        const error = { type: 'required', message: 'Password is required' };

        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordRegister={mockPasswordRegister}
                passwordError={error as any}
                password=''
                passwordIsValid={false}
                requiresPasswordConfirmation={false}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should display password confirmation error', () => {
        const error = { type: 'validate', message: "Passwords don't match" };

        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordConfirmationId='confirm-id'
                passwordRegister={mockPasswordRegister}
                passwordConfirmationRegister={mockConfirmRegister}
                passwordConfirmationError={error as any}
                password='test123'
                passwordIsValid={true}
                requiresPasswordConfirmation={true}
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });

    it('should apply password placeholder', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordRegister={mockPasswordRegister}
                password=''
                passwordIsValid={false}
                requiresPasswordConfirmation={false}
                passwordPlaceholder='Enter strong password'
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByPlaceholderText('Enter strong password')).toBeInTheDocument();
    });

    it('should apply confirmation placeholder', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordConfirmationId='confirm-id'
                passwordRegister={mockPasswordRegister}
                passwordConfirmationRegister={mockConfirmRegister}
                password='test123'
                passwordIsValid={true}
                requiresPasswordConfirmation={true}
                passwordConfirmationPlaceholder='Re-enter password'
            />,
            { wrapper: defaultAppRoot },
        );

        expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
    });

    it('should have proper aria attributes', () => {
        render(
            <PasswordFieldWithVerifier
                passwordId='pwd-id'
                passwordVerifierId='verifier-id'
                passwordRegister={mockPasswordRegister}
                password='test'
                passwordIsValid={true}
                requiresPasswordConfirmation={false}
            />,
            { wrapper: defaultAppRoot },
        );

        const passwordInput = screen.getByLabelText(/^password/i);
        expect(passwordInput).toHaveAttribute('aria-required', 'true');
        expect(passwordInput).toHaveAttribute('aria-describedby');
    });
});
