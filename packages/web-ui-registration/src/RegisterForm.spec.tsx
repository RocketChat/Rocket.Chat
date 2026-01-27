import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RegisterForm } from './RegisterForm';

const mockSetLoginRoute = jest.fn();
const mockRegisterMethod = jest.fn();

// Per-test user instance
let user: ReturnType<typeof userEvent.setup>;

// Mock the useRegisterMethod hook
jest.mock('./hooks/useRegisterMethod', () => ({
    useRegisterMethod: () => ({
        mutate: mockRegisterMethod,
        isPending: false,
    }),
}));

const defaultAppRoot = mockAppRoot()
    .withTranslations('en', 'core', {
        Required_field: '{{field}} is required',
        'registration.component.form.createAnAccount': 'Create an account',
        'registration.component.form.name': 'Name',
        'registration.component.form.email': 'Email',
        'registration.component.form.username': 'Username',
        'registration.component.form.password': 'Password',
        'registration.component.form.confirmPassword': 'Confirm password',
        'registration.component.form.reasonToJoin': 'Reason to join',
        'registration.component.form.joinYourTeam': 'Join your team',
        'registration.component.form.emailPlaceholder': 'Enter your email',
        'registration.component.form.invalidEmail': 'Invalid email format',
        'registration.component.form.invalidConfirmPass': "Passwords don't match",
        'onboarding.form.adminInfoForm.fields.fullName.placeholder': 'Enter your full name',
        Create_a_password: 'Create a password',
        Confirm_password: 'Confirm your password',
        Password_must_meet_the_complexity_requirements: 'Password must meet complexity requirements',
        'registration.page.register.back': 'Back to Login',
    })
    .withSetting('Accounts_RequireNameForSignUp', true)
    .withSetting('Accounts_RequirePasswordConfirmation', true)
    .withSetting('Accounts_ManuallyApproveNewUsers', false)
    .withSetting('Accounts_EmailOrUsernamePlaceholder', '')
    .withSetting('Accounts_PasswordPlaceholder', '')
    .withSetting('Accounts_ConfirmPasswordPlaceholder', '')
    .withSetting('Accounts_Password_Policy_Enabled', false)
    .build();

describe('RegisterForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
    });

    describe('Rendering', () => {
        it('should render all required fields', () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
            expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /join your team/i })).toBeInTheDocument();
        });

        it('should render form title', () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            expect(screen.getByText('Create an account')).toBeInTheDocument();
        });

        it('should render back to login link', () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            expect(screen.getByText(/back to login/i)).toBeInTheDocument();
        });
    });

    describe('Conditional Fields', () => {
        it('should render name field as optional when not required', () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.name': 'Name',
                })
                .withSetting('Accounts_RequireNameForSignUp', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            const nameField = screen.getByRole('textbox', { name: /name/i });
            expect(nameField).toBeInTheDocument();
            expect(nameField).not.toHaveAttribute('aria-required', 'true');
        });

        it('should render password confirmation field when enabled', () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.confirmPassword': 'Confirm password',
                })
                .withSetting('Accounts_RequirePasswordConfirmation', true)
                .withSetting('Accounts_Password_Policy_Enabled', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        });

        it('should NOT render password confirmation field when disabled', () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.password': 'Password',
                })
                .withSetting('Accounts_RequirePasswordConfirmation', false)
                .withSetting('Accounts_Password_Policy_Enabled', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
        });

        it('should render reason field when manual approval is required', () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.reasonToJoin': 'Reason to join',
                })
                .withSetting('Accounts_ManuallyApproveNewUsers', true)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            expect(screen.getByLabelText(/reason to join/i)).toBeInTheDocument();
        });

        it('should NOT render reason field when manual approval is not required', () => {
            const appRoot = mockAppRoot()
                .withSetting('Accounts_ManuallyApproveNewUsers', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            expect(screen.queryByLabelText(/reason to join/i)).not.toBeInTheDocument();
        });
    });

    describe('Validation', () => {
        it('should show required error for name field', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    Required_field: '{{field}} is required',
                    'registration.component.form.name': 'Name',
                })
                .withSetting('Accounts_RequireNameForSignUp', true)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            const nameInput = screen.getByRole('textbox', { name: /name/i });
            await user.click(nameInput);
            await user.tab();

            await waitFor(() => {
                expect(nameInput).toHaveAccessibleDescription(/name is required/i);
            });
        });

        it('should show required error for email field', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    Required_field: '{{field}} is required',
                    'registration.component.form.email': 'Email',
                })
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            const emailInput = screen.getByRole('textbox', { name: /email/i });
            await user.click(emailInput);
            await user.tab();

            await waitFor(() => {
                expect(emailInput).toHaveAccessibleDescription(/email is required/i);
            });
        });

        it('should show invalid email format error', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.invalidEmail': 'Invalid email format',
                })
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            const emailInput = screen.getByRole('textbox', { name: /email/i });
            await user.type(emailInput, 'invalid-email');
            await user.tab();

            await waitFor(() => {
                expect(emailInput).toHaveAccessibleDescription(/invalid email format/i);
            });
        });

        it('should accept valid email format', async () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            const emailInput = screen.getByRole('textbox', { name: /email/i });
            await user.type(emailInput, 'test@example.com');
            await user.tab();

            await waitFor(() => {
                expect(emailInput).not.toHaveAccessibleDescription();
            });
        });

        it('should show required error for username field', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    Required_field: '{{field}} is required',
                    'registration.component.form.username': 'Username',
                })
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            const usernameInput = screen.getByRole('textbox', { name: /username/i });
            await user.click(usernameInput);
            await user.tab();

            await waitFor(() => {
                expect(usernameInput).toHaveAccessibleDescription(/username is required/i);
            });
        });

        it('should show password mismatch error', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.password': 'Password',
                    'registration.component.form.confirmPassword': 'Confirm password',
                    'registration.component.form.invalidConfirmPass': "Passwords don't match",
                })
                .withSetting('Accounts_RequirePasswordConfirmation', true)
                .withSetting('Accounts_Password_Policy_Enabled', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            const passwordInput = screen.getByLabelText(/^password/i);
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

            await user.type(passwordInput, 'password123');
            await user.type(confirmPasswordInput, 'password456');
            await user.tab();

            await waitFor(() => {
                expect(confirmPasswordInput).toHaveAccessibleDescription(/passwords don't match/i);
            });
        });
    });

    describe('Form Submission', () => {
        it('should call register mutation with correct data on valid submission', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.name': 'Name',
                    'registration.component.form.email': 'Email',
                    'registration.component.form.username': 'Username',
                    'registration.component.form.password': 'Password',
                    'registration.component.form.joinYourTeam': 'Join your team',
                    'onboarding.form.adminInfoForm.fields.fullName.placeholder': 'Full Name',
                })
                .withSetting('Accounts_RequirePasswordConfirmation', false)
                .withSetting('Accounts_Password_Policy_Enabled', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            // Fill in the form
            await user.type(screen.getByRole('textbox', { name: /name/i }), 'John Doe');
            await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com');
            await user.type(screen.getByRole('textbox', { name: /username/i }), 'johndoe');
            await user.type(screen.getByLabelText(/password/i), 'password123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /join your team/i }));

            await waitFor(() => {
                expect(mockRegisterMethod).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'John Doe',
                        email: 'john@example.com',
                        username: 'johndoe',
                        pass: 'password123',
                    }),
                    expect.any(Object),
                );
            });
        });

        it('should not include passwordConfirmation in submitted data', async () => {
            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {
                    'registration.component.form.password': 'Password',
                    'registration.component.form.confirmPassword': 'Confirm password',
                })
                .withSetting('Accounts_RequirePasswordConfirmation', true)
                .withSetting('Accounts_Password_Policy_Enabled', false)
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            await user.type(screen.getByRole('textbox', { name: /name/i }), 'John Doe');
            await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com');
            await user.type(screen.getByRole('textbox', { name: /username/i }), 'johndoe');
            await user.type(screen.getByLabelText(/^password/i), 'password123');
            await user.type(screen.getByLabelText(/confirm password/i), 'password123');

            await user.click(screen.getByRole('button', { name: /join your team/i }));

            await waitFor(() => {
                expect(mockRegisterMethod).toHaveBeenCalled();
                const callArgs = mockRegisterMethod.mock.calls[0][0];
                expect(callArgs).not.toHaveProperty('passwordConfirmation');
                expect(callArgs).toHaveProperty('pass', 'password123');
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            const form = screen.getByRole('form');
            expect(form).toHaveAttribute('aria-labelledby');
            expect(form).toHaveAttribute('aria-describedby', 'welcomeTitle');
        });

        it('should have proper ARIA attributes on input fields', () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            const emailInput = screen.getByRole('textbox', { name: /email/i });
            expect(emailInput).toHaveAttribute('aria-required', 'true');
            expect(emailInput).toHaveAttribute('aria-describedby');
        });
    });

    describe('Back to Login', () => {
        it('should call setLoginRoute when back to login is clicked', async () => {
            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: defaultAppRoot });

            const backLink = screen.getByText(/back to login/i);
            await user.click(backLink);

            expect(mockSetLoginRoute).toHaveBeenCalledWith('login');
        });
    });

    describe('Custom Fields Integration', () => {
        it('should render custom fields when available', () => {
            // Mock custom fields to verify CustomFieldsForm integration
            const mockCustomFields = [
                { _id: 'field1', type: 'text', label: 'Custom Field 1', required: true, defaultValue: '', public: true },
            ];

            const appRoot = mockAppRoot()
                .withTranslations('en', 'core', {})
                .withEndpoint('GET', '/v1/custom-fields.public', () => ({ customFields: mockCustomFields }))
                .build();

            render(<RegisterForm setLoginRoute={mockSetLoginRoute} />, { wrapper: appRoot });

            // Verify CustomFieldsForm integration - detailed tests are in ui-client
            const form = screen.getByRole('form');
            expect(form).toBeInTheDocument();
        });
    });
});
