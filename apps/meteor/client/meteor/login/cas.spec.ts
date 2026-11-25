import './cas';
import { getLoginWithMethod } from '../accounts';

const mockCallLoginMethod = jest.fn();
const mockOpenCASLoginPopup = jest.fn();

jest.mock('../accounts', () => {
	const methods = new Map<string, (...args: any[]) => void>();
	return {
		callLoginMethod: (...args: unknown[]) => mockCallLoginMethod(...args),
		registerLoginWithMethod: (name: string, method: (...args: any[]) => void) => methods.set(name, method),
		getLoginWithMethod: (name: string) => methods.get(name),
	};
});

jest.mock('../../lib/openCASLoginPopup', () => ({
	openCASLoginPopup: (...args: unknown[]) => mockOpenCASLoginPopup(...args),
}));

const loginWithCas = () => new Promise((resolve) => getLoginWithMethod('loginWithCas')?.(undefined, resolve));

describe('loginWithCas', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('logs in with the credential token the CAS popup was opened with', async () => {
		mockOpenCASLoginPopup.mockResolvedValue(undefined);
		mockCallLoginMethod.mockResolvedValue(undefined);

		await expect(loginWithCas()).resolves.toBeUndefined();

		const [credentialToken] = mockOpenCASLoginPopup.mock.calls[0];
		expect(credentialToken).toEqual(expect.any(String));
		expect(mockCallLoginMethod).toHaveBeenCalledWith({ methodArguments: [{ cas: { credentialToken } }] });
	});

	it('passes the popup error to the callback and sends no login request', async () => {
		const error = new Error('CAS_login_url not set');
		mockOpenCASLoginPopup.mockRejectedValue(error);

		await expect(loginWithCas()).resolves.toBe(error);

		expect(mockCallLoginMethod).not.toHaveBeenCalled();
	});
});
