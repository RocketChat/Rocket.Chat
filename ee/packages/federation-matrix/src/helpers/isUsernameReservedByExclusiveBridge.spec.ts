import { federationSDK } from '@rocket.chat/federation-sdk';

import { isUsernameReservedByExclusiveBridge } from './isUsernameReservedByExclusiveBridge';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		isExclusiveNamespace: jest.fn(),
	},
}));

const mockGetConfig = federationSDK.getConfig as jest.MockedFunction<typeof federationSDK.getConfig>;
const mockIsExclusiveNamespace = federationSDK.isExclusiveNamespace as jest.MockedFunction<typeof federationSDK.isExclusiveNamespace>;

describe('isUsernameReservedByExclusiveBridge', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetConfig.mockReturnValue('example.com');
	});

	it('should return false when federation is not configured (no serverName)', () => {
		mockGetConfig.mockReturnValue('');

		expect(isUsernameReservedByExclusiveBridge('irc_bob')).toBe(false);
		expect(mockIsExclusiveNamespace).not.toHaveBeenCalled();
	});

	it('should return false when the username matches no exclusive namespace', () => {
		mockIsExclusiveNamespace.mockReturnValue(undefined);

		expect(isUsernameReservedByExclusiveBridge('alice')).toBe(false);
	});

	it('should build the full MXID from the username and server name', () => {
		mockIsExclusiveNamespace.mockReturnValue(undefined);

		isUsernameReservedByExclusiveBridge('alice');

		expect(mockIsExclusiveNamespace).toHaveBeenCalledWith('users', '@alice:example.com');
	});

	it('should return true when the username falls within an exclusive namespace', () => {
		mockIsExclusiveNamespace.mockImplementation((_type, value) =>
			value === '@irc_bob:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
		);

		expect(isUsernameReservedByExclusiveBridge('irc_bob')).toBe(true);
	});

	it('should also match against the lowercased localpart', () => {
		mockIsExclusiveNamespace.mockImplementation((_type, value) =>
			value === '@irc_bob:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
		);

		expect(isUsernameReservedByExclusiveBridge('IRC_bob')).toBe(true);
	});
});
