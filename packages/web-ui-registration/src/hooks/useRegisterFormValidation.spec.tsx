import { renderHook } from '@testing-library/react';
import { mockAppRoot } from '@rocket.chat/mock-providers';

import { useRegisterFormValidation } from './useRegisterFormValidation';

const mockWatch = jest.fn();

const defaultAppRoot = mockAppRoot()
    .withTranslations('en', 'core', {
        Required_field: '{{field}} is required',
        'registration.component.form.name': 'Name',
        'registration.component.form.email': 'Email',
        'registration.component.form.username': 'Username',
        'registration.component.form.password': 'Password',
        'registration.component.form.confirmPassword': 'Confirm password',
        'registration.component.form.reasonToJoin': 'Reason to join',
        'registration.component.form.invalidEmail': 'Invalid email format',
        'registration.component.form.invalidConfirmPass': "Passwords don't match",
        Password_must_meet_the_complexity_requirements: 'Password must meet complexity requirements',
    })
    .withSetting('Accounts_RequireNameForSignUp', true)
    .withSetting('Accounts_RequirePasswordConfirmation', true)
    .withSetting('Accounts_ManuallyApproveNewUsers', false)
    .withSetting('Accounts_Password_Policy_Enabled', false)
    .build();

describe('useRegisterFormValidation', () => {
    beforeEach(() => {
        mockWatch.mockReturnValue({ password: '' });
    });

    it('should return validation rules', () => {
        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: defaultAppRoot,
        });

        expect(result.current.validationRules).toBeDefined();
        expect(result.current.validationRules.name).toBeDefined();
        expect(result.current.validationRules.email).toBeDefined();
        expect(result.current.validationRules.username).toBeDefined();
        expect(result.current.validationRules.password).toBeDefined();
        expect(result.current.validationRules.passwordConfirmation).toBeDefined();
        expect(result.current.validationRules.reason).toBeDefined();
    });

    it('should return settings values', () => {
        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: defaultAppRoot,
        });

        expect(result.current.requireNameForRegister).toBe(true);
        expect(result.current.requiresPasswordConfirmation).toBe(true);
        expect(result.current.manuallyApproveNewUsersRequired).toBe(false);
    });

    it('should set name as optional when not required', () => {
        const appRoot = mockAppRoot()
            .withTranslations('en', 'core', {
                'registration.component.form.name': 'Name',
            })
            .withSetting('Accounts_RequireNameForSignUp', false)
            .build();

        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: appRoot,
        });

        expect(result.current.validationRules.name.required).toBe(false);
        expect(result.current.requireNameForRegister).toBe(false);
    });

    it('should include email pattern validation', () => {
        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: defaultAppRoot,
        });

        expect(result.current.validationRules.email.pattern).toBeDefined();
        expect(result.current.validationRules.email.pattern.value).toBeInstanceOf(RegExp);
    });

    it('should validate password confirmation matches password', () => {
        mockWatch.mockImplementation((field?: string) => {
            if (field === 'password') return 'test123';
            return { password: 'test123' };
        });

        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: defaultAppRoot,
        });

        const validateFn = result.current.validationRules.passwordConfirmation.validate;
        expect(validateFn('test123')).toBe(true);
        expect(validateFn('different')).toBe("Passwords don't match");
    });

    it('should return passwordIsValid based on password policy', () => {
        mockWatch.mockReturnValue({ password: 'ValidPassword123!' });

        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: defaultAppRoot,
        });

        // With disabled password policy, any password is valid
        expect(result.current.passwordIsValid).toBe(true);
    });

    it('should have correct password dependencies', () => {
        const { result } = renderHook(() => useRegisterFormValidation(mockWatch as any), {
            wrapper: defaultAppRoot,
        });

        expect(result.current.validationRules.passwordConfirmation.deps).toEqual(['password']);
    });
});
