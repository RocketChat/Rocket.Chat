import './ldap';
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

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: ({ props }: { props: { onConfirm: (code: string, method: string) => Promise<void> } }) => props.onConfirm('123456', 'totp'),
		close: jest.fn(),
	},
}));

describe('loginWithLDAP', () => {
	it('sends the LDAP credentials, and sends them again inside the TOTP request when the server asks for a code', async () => {
		mockCallLoginMethod.mockRejectedValueOnce({ error: 'totp-required', details: { method: 'totp' } }).mockResolvedValueOnce(undefined);
		const ldapLogin = { ldap: true, username: 'alice', ldapPass: 'secret', ldapOptions: {} };

		await new Promise((resolve) => getLoginWithMethod('loginWithLDAP')?.('alice', 'secret', resolve));

		expect(mockCallLoginMethod.mock.calls).toEqual([
			[{ methodArguments: [ldapLogin] }],
			[{ methodArguments: [{ totp: { login: ldapLogin, code: '123456' } }] }],
		]);
	});
});
