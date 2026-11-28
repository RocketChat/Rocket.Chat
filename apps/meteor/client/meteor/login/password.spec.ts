import { loginWithPasswordAndTOTP } from './password';
import { getLoginWithMethod } from '../accounts';

const mockCallLoginMethod = jest.fn();

jest.mock('../accounts', () => {
	const methods = new Map<string, (...args: any[]) => void>();
	return {
		callLoginMethod: (...args: unknown[]) => mockCallLoginMethod(...args),
		registerLoginWithMethod: (name: string, method: (...args: any[]) => void) => methods.set(name, method),
		getLoginWithMethod: (name: string) => methods.get(name),
	};
});

const sha256OfSecret = { digest: '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b', algorithm: 'sha-256' };

describe('loginWithPassword', () => {
	beforeEach(() => {
		mockCallLoginMethod.mockResolvedValue(undefined);
	});

	it.each([
		['a username', 'alice', { username: 'alice' }],
		['an email', 'alice@example.com', { email: 'alice@example.com' }],
		['a user object', { id: 'user-id' }, { id: 'user-id' }],
	])('sends %s as the user selector and the SHA-256 digest of the password', async (_, userDescriptor, user) => {
		await new Promise((resolve) => getLoginWithMethod('loginWithPassword')?.(userDescriptor, 'secret', resolve));

		expect(mockCallLoginMethod).toHaveBeenCalledWith({ methodArguments: [{ user, password: sha256OfSecret }] });
	});
});

describe('loginWithPasswordAndTOTP', () => {
	const error = { error: 'totp-invalid' };

	beforeEach(() => {
		mockCallLoginMethod.mockRejectedValue(error);
	});

	it('tells the callback when the TOTP login succeeds', async () => {
		mockCallLoginMethod.mockResolvedValue(undefined);
		const callback = jest.fn();

		await loginWithPasswordAndTOTP('alice', 'secret', '123456', callback);

		expect(callback).toHaveBeenCalledWith(undefined);
	});

	it('passes a TOTP failure to the callback without rejecting', async () => {
		const callback = jest.fn();

		await expect(loginWithPasswordAndTOTP('alice', 'secret', '123456', callback)).resolves.toBeUndefined();

		expect(callback).toHaveBeenCalledWith(error);
		expect(mockCallLoginMethod).toHaveBeenCalledWith({
			methodArguments: [{ totp: { login: { user: { username: 'alice' }, password: sha256OfSecret }, code: '123456' } }],
		});
	});

	it('rejects with the TOTP failure when there is no callback', async () => {
		await expect(loginWithPasswordAndTOTP('alice', 'secret', '123456')).rejects.toBe(error);
	});
});
