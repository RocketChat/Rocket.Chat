import { loginWithSamlToken, logoutFromSamlIdp } from './saml';
import { STORAGE_KEYS, getStoredItem, setStoredItem } from '../../lib/sdk/storage';

const mockCallLoginMethod = jest.fn();
const mockSdkCall = jest.fn();
const mockSettings: Record<string, unknown> = {
	SAML_Custom_Default: true,
	SAML_Custom_Default_logout_behaviour: 'SAML',
	SAML_Custom_Default_provider: 'idp',
	SAML_Custom_Default_idp_slo_redirect_url: 'https://idp.example.com/slo',
};

jest.mock('../accounts', () => ({
	callLoginMethod: (...args: unknown[]) => mockCallLoginMethod(...args),
	registerLoginWithMethod: jest.fn(),
}));

jest.mock('../../lib/settings', () => ({
	settings: { peek: (id: string) => mockSettings[id] },
}));

jest.mock('../../lib/SDKClient', () => ({
	sdk: { call: (...args: unknown[]) => mockSdkCall(...args) },
}));

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: ({ props }: { props: { onConfirm: (code: string, method: string) => Promise<void> } }) => props.onConfirm('123456', 'totp'),
		close: jest.fn(),
	},
}));

describe('loginWithSamlToken', () => {
	it('sends the SAML credential token again with the code when the server asks for a TOTP code', async () => {
		mockCallLoginMethod.mockRejectedValueOnce({ error: 'totp-required', details: { method: 'totp' } }).mockResolvedValueOnce(undefined);

		await new Promise((resolve) => loginWithSamlToken('credential-token', resolve));

		expect(mockCallLoginMethod).toHaveBeenLastCalledWith({
			methodArguments: [{ totp: { login: { saml: true, credentialToken: 'credential-token' }, code: '123456' } }],
		});
	});

	it('reports "result is undefined" to the callback after a successful TOTP retry', async () => {
		mockCallLoginMethod.mockRejectedValueOnce({ error: 'totp-required', details: { method: 'totp' } }).mockResolvedValueOnce(undefined);

		const error = await new Promise((resolve) => loginWithSamlToken('credential-token', resolve));

		expect(error).toEqual(new Error('Unexpected error: result is undefined'));
	});
});

describe('logoutFromSamlIdp', () => {
	beforeEach(() => {
		setStoredItem(STORAGE_KEYS.USER_ID, 'user-id');
	});

	it('asks for a local logout when the identity provider gives no logout request', async () => {
		mockSdkCall.mockResolvedValue(undefined);

		await expect(logoutFromSamlIdp()).resolves.toBe(false);

		expect(mockSdkCall).toHaveBeenCalledWith('samlLogout', 'idp');
		expect(getStoredItem(STORAGE_KEYS.USER_ID)).toBe('user-id');
	});

	it('asks for a local logout when the single logout call fails', async () => {
		mockSdkCall.mockRejectedValue(new Error('network'));

		await expect(logoutFromSamlIdp()).resolves.toBe(false);

		expect(getStoredItem(STORAGE_KEYS.USER_ID)).toBe('user-id');
	});
});
