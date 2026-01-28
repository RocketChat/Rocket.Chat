import { renderHook } from '@testing-library/react';
import { mockAppRoot } from '@rocket.chat/mock-providers';

import { useRegisterErrorHandler } from './useRegisterErrorHandler';

const mockSetError = jest.fn();
const mockSetServerError = jest.fn();
const mockSetLoginRoute = jest.fn();
const mockDispatchToastMessage = jest.fn();

// Mock the useToastMessageDispatch hook
jest.mock('@rocket.chat/ui-contexts', () => ({
    ...jest.requireActual('@rocket.chat/ui-contexts'),
    useToastMessageDispatch: () => mockDispatchToastMessage,
}));

const defaultAppRoot = mockAppRoot()
    .withTranslations('en', 'core', {
        'registration.component.form.invalidEmail': 'Invalid email format',
        'registration.component.form.usernameAlreadyExists': 'Username already exists',
        'registration.component.form.emailAlreadyExists': 'Email already exists',
        'registration.component.form.userAlreadyExist': 'User already exists',
        'registration.component.form.usernameContainsInvalidChars': 'Username contains invalid characters',
        'registration.component.form.nameContainsInvalidChars': 'Name contains invalid characters',
        'registration.page.registration.waitActivationWarning': 'Please wait for activation',
    })
    .build();

describe('useRegisterErrorHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle error-invalid-email error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'error-invalid-email' };
        result.current.handleRegisterError(error);

        expect(mockSetError).toHaveBeenCalledWith('email', {
            type: 'invalid-email',
            message: 'Invalid email format',
        });
    });

    it('should handle error-user-already-exists error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { errorType: 'error-user-already-exists' };
        result.current.handleRegisterError(error);

        expect(mockSetError).toHaveBeenCalledWith('username', {
            type: 'user-already-exists',
            message: 'Username already exists',
        });
    });

    it('should handle "Email already exists" error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'Email already exists for user' };
        result.current.handleRegisterError(error);

        expect(mockSetError).toHaveBeenCalledWith('email', {
            type: 'email-already-exists',
            message: 'Email already exists',
        });
    });

    it('should handle "Username is already in use" error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'Username is already in use' };
        result.current.handleRegisterError(error);

        expect(mockSetError).toHaveBeenCalledWith('username', {
            type: 'username-already-exists',
            message: 'User already exists',
        });
    });

    it('should handle "The username provided is not valid" error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'The username provided is not valid' };
        result.current.handleRegisterError(error);

        expect(mockSetError).toHaveBeenCalledWith('username', {
            type: 'username-contains-invalid-chars',
            message: 'Username contains invalid characters',
        });
    });

    it('should handle "Name contains invalid characters" error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'Name contains invalid characters' };
        result.current.handleRegisterError(error);

        expect(mockSetError).toHaveBeenCalledWith('name', {
            type: 'name-contains-invalid-chars',
            message: 'Name contains invalid characters',
        });
    });

    it('should handle error-too-many-requests error with toast', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'error-too-many-requests' };
        result.current.handleRegisterError(error);

        expect(mockDispatchToastMessage).toHaveBeenCalledWith({
            type: 'error',
            message: 'error-too-many-requests',
        });
    });

    it('should handle error-user-is-not-activated error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = { error: 'error-user-is-not-activated' };
        result.current.handleRegisterError(error);

        expect(mockDispatchToastMessage).toHaveBeenCalledWith({
            type: 'info',
            message: 'Please wait for activation',
        });
        expect(mockSetLoginRoute).toHaveBeenCalledWith('login');
    });

    it('should handle error-user-registration-custom-field error', () => {
        const { result } = renderHook(() => useRegisterErrorHandler(mockSetError, mockSetServerError, mockSetLoginRoute), {
            wrapper: defaultAppRoot,
        });

        const error = {
            error: 'error-user-registration-custom-field',
            message: 'Custom field validation failed',
        };
        result.current.handleRegisterError(error);

        expect(mockSetServerError).toHaveBeenCalledWith('Custom field validation failed');
    });
});
