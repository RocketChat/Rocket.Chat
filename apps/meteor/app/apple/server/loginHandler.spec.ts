import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../settings/server';
import { handleIdentityToken } from '../lib/handleIdentityToken';

jest.mock(
	'meteor/accounts-base',
	() => ({
		Accounts: {
			registerLoginHandler: jest.fn(),
			updateOrCreateUserFromExternalService: jest.fn(),
			LoginCancelledError: { numericError: 400 },
		},
	}),
	{ virtual: true },
);

jest.mock(
	'meteor/meteor',
	() => ({
		Meteor: {
			Error: class extends Error {
				constructor(
					public error: number,
					public reason: string,
				) {
					super(reason);
				}
			},
		},
	}),
	{ virtual: true },
);

jest.mock('../../settings/server', () => ({
	settings: {
		get: jest.fn(),
	},
}));

jest.mock('../lib/handleIdentityToken', () => ({
	handleIdentityToken: jest.fn(),
}));

describe('Apple OAuth loginHandler', () => {
	let loginHandlerCallback: Parameters<typeof Accounts.registerLoginHandler>[1];

	beforeAll(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('./loginHandler');
		loginHandlerCallback = jest.mocked(Accounts.registerLoginHandler).mock.calls[0][1];
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(settings.get).mockImplementation((key) => {
			if (key === 'Accounts_OAuth_Apple') return true;
			if (key === 'Accounts_OAuth_Apple_id') return 'com.yourcompany.app';
			return null;
		});
	});

	it('should not use the client-provided email if Apple does not provide one', async () => {
		jest.mocked(handleIdentityToken).mockResolvedValue({
			id: 'apple-sub-123',
		});

		const maliciousLoginRequest = {
			identityToken: 'valid.token.without_email',
			email: 'alice@email.tld',
			fullName: { givenName: 'Alice', familyName: 'Sender' },
		};

		jest.mocked(Accounts.updateOrCreateUserFromExternalService).mockResolvedValue({ userId: 'new-user-id' });

		await loginHandlerCallback(maliciousLoginRequest);

		expect(Accounts.updateOrCreateUserFromExternalService).toHaveBeenCalledWith(
			'apple',
			{ id: 'apple-sub-123' },
			{ profile: { name: 'Alice Sender' } },
		);
	});

	it('should successfully pass the email if Apple natively provides it in the signed JWT', async () => {
		jest.mocked(handleIdentityToken).mockResolvedValue({
			id: 'apple-sub-123',
			email: 'legit@email.tld',
		});

		const legitLoginRequest = {
			identityToken: 'valid.token.with_email',
			fullName: { givenName: 'John', familyName: 'Doe' },
		};

		jest.mocked(Accounts.updateOrCreateUserFromExternalService).mockResolvedValue({ userId: 'user-id' });

		await loginHandlerCallback(legitLoginRequest);

		expect(Accounts.updateOrCreateUserFromExternalService).toHaveBeenCalledWith(
			'apple',
			{ id: 'apple-sub-123', email: 'legit@email.tld' },
			{ profile: { name: 'John Doe' } },
		);
	});

	it('should pass empty client id to token validation when setting is not configured', async () => {
		jest.mocked(settings.get).mockImplementation((key) => {
			if (key === 'Accounts_OAuth_Apple') return true;
			if (key === 'Accounts_OAuth_Apple_id') return '';
			return null;
		});

		jest.mocked(handleIdentityToken).mockResolvedValue({ id: 'apple-sub-123' });
		jest.mocked(Accounts.updateOrCreateUserFromExternalService).mockResolvedValue({ userId: 'user-id' });

		await loginHandlerCallback({
			identityToken: 'valid.token.with_mobile_default_audience',
			fullName: { givenName: 'Mobile', familyName: 'User' },
		});

		expect(handleIdentityToken).toHaveBeenCalledWith('valid.token.with_mobile_default_audience', '');
	});
});
