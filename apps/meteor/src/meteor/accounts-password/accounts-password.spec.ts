import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';
import { PasswordAuthMixin } from 'meteor/accounts-password';

// 1. Mock the global Meteor dependencies
vi.mock('meteor/meteor', () => ({
    Meteor: {
        user: vi.fn(),
    },
}));

vi.mock('meteor/sha', () => ({
    SHA256: vi.fn((str) => `mock-hash-${str}`),
}));

// 2. Create a Mock Base Class that satisfies the Mixin's dependencies
class MockAccountsBase {
    public callLoginMethod = vi.fn();
    public connection = {
        applyAsync: vi.fn(),
    };
}

// 3. Apply the mixin to create our Test Client Class
const TestAccountsClient = PasswordAuthMixin(MockAccountsBase);

describe('PasswordAuthMixin (Client)', () => {
    let client: InstanceType<typeof TestAccountsClient>;

    beforeEach(() => {
        vi.clearAllMocks();
        // Instantiate a fresh client before each test
        client = new TestAccountsClient();
    });

    describe('hashPassword', () => {
        it('returns standard meteor hash structure', () => {
            const result = client.hashPassword('my-secure-password');
            expect(SHA256).toHaveBeenCalledWith('my-secure-password');
            expect(result).toEqual({
                digest: 'mock-hash-my-secure-password',
                algorithm: 'sha-256',
            });
        });
    });

    describe('loginWithPassword', () => {
        it('formats a string email correctly', () => {
            client.loginWithPassword('test@example.com', 'password123');

            expect(client.callLoginMethod).toHaveBeenCalledWith(
                expect.objectContaining({
                    methodArguments: [
                        {
                            user: { email: 'test@example.com' },
                            password: client.hashPassword('password123'),
                        },
                    ],
                })
            );
        });

        it('formats a string username correctly', () => {
            client.loginWithPassword('testuser', 'password123');

            expect(client.callLoginMethod).toHaveBeenCalledWith(
                expect.objectContaining({
                    methodArguments: [
                        {
                            user: { username: 'testuser' },
                            password: client.hashPassword('password123'),
                        },
                    ],
                })
            );
        });
    });

    describe('createUser', () => {
        it('throws error if password is empty', () => {
            expect(() => client.createUser({ username: 'bob', password: '' })).toThrowError(
                'Password may not be empty'
            );
        });

        it('calls callLoginMethod with hashed password', () => {
            client.createUser({ username: 'bob', email: 'bob@bob.com', password: 'password123' });

            expect(client.callLoginMethod).toHaveBeenCalledWith(
                expect.objectContaining({
                    methodName: 'createUser',
                    methodArguments: [
                        {
                            username: 'bob',
                            email: 'bob@bob.com',
                            password: client.hashPassword('password123'),
                        },
                    ],
                })
            );
        });
    });

    describe('changePassword', () => {
        it('throws if user is not logged in', () => {
            vi.mocked(Meteor).user.mockReturnValueOnce(null);
            expect(() => client.changePassword('old', 'new')).toThrowError(
                'Must be logged in to change password.'
            );
        });

        it('applies changePassword via connection', () => {
            // Simulate a logged-in user
            vi.mocked(Meteor).user.mockReturnValueOnce({ _id: '123' });
            vi.mocked(client.connection.applyAsync).mockResolvedValueOnce(true);

            client.changePassword('old', 'new');

            expect(client.connection.applyAsync).toHaveBeenCalledWith('changePassword', [
                client.hashPassword('old'),
                client.hashPassword('new'),
            ]);
        });
    });

    describe('forgotPassword', () => {
        it('requires an email option', () => {
            expect(() => client.forgotPassword({ email: '' })).toThrowError('Must pass options.email');
        });

        it('applies forgotPassword via connection', () => {
            (client.connection.applyAsync as any).mockResolvedValueOnce(true);

            client.forgotPassword({ email: 'test@example.com' });

            expect(client.connection.applyAsync).toHaveBeenCalledWith('forgotPassword', [
                { email: 'test@example.com' },
            ]);
        });
    });

    describe('resetPassword & verifyEmail', () => {
        it('resetPassword calls resetPassword method', () => {
            client.resetPassword('token-abc', 'new-pass');

            expect(client.callLoginMethod).toHaveBeenCalledWith(
                expect.objectContaining({
                    methodName: 'resetPassword',
                    methodArguments: ['token-abc', client.hashPassword('new-pass')],
                })
            );
        });

        it('verifyEmail calls verifyEmail method', () => {
            client.verifyEmail('token-abc');

            expect(client.callLoginMethod).toHaveBeenCalledWith(
                expect.objectContaining({
                    methodName: 'verifyEmail',
                    methodArguments: ['token-abc'],
                })
            );
        });
    });
});