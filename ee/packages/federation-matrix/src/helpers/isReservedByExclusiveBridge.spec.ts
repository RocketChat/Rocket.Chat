import { federationSDK } from '@rocket.chat/federation-sdk';

import { isReservedByExclusiveBridge } from './isReservedByExclusiveBridge';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		isExclusiveNamespace: jest.fn(),
	},
}));

const mockGetConfig = federationSDK.getConfig as jest.MockedFunction<typeof federationSDK.getConfig>;
const mockIsExclusiveNamespace = federationSDK.isExclusiveNamespace as jest.MockedFunction<typeof federationSDK.isExclusiveNamespace>;

describe('isReservedByExclusiveBridge', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetConfig.mockReturnValue('example.com');
	});

	it('should return false when federation is not configured (no serverName)', () => {
		mockGetConfig.mockReturnValue('');

		expect(isReservedByExclusiveBridge('user', 'irc_bob')).toBe(false);
		expect(isReservedByExclusiveBridge('room', 'irc_general')).toBe(false);
		expect(mockIsExclusiveNamespace).not.toHaveBeenCalled();
	});

	describe('user', () => {
		it('should return false when the username matches no exclusive namespace', () => {
			mockIsExclusiveNamespace.mockReturnValue(undefined);

			expect(isReservedByExclusiveBridge('user', 'alice')).toBe(false);
		});

		it('should check the `users` namespace with the full MXID', () => {
			mockIsExclusiveNamespace.mockReturnValue(undefined);

			isReservedByExclusiveBridge('user', 'alice');

			expect(mockIsExclusiveNamespace).toHaveBeenCalledWith('users', '@alice:example.com');
		});

		it('should return true when the username falls within an exclusive namespace', () => {
			mockIsExclusiveNamespace.mockImplementation((_type, value) =>
				value === '@irc_bob:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
			);

			expect(isReservedByExclusiveBridge('user', 'irc_bob')).toBe(true);
		});

		it('should also match against the lowercased localpart', () => {
			mockIsExclusiveNamespace.mockImplementation((_type, value) =>
				value === '@irc_bob:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
			);

			expect(isReservedByExclusiveBridge('user', 'IRC_bob')).toBe(true);
		});
	});

	describe('room', () => {
		it('should check both the `aliases` and `rooms` namespaces with the room alias', () => {
			mockIsExclusiveNamespace.mockReturnValue(undefined);

			isReservedByExclusiveBridge('room', 'general');

			expect(mockIsExclusiveNamespace).toHaveBeenCalledWith('aliases', '#general:example.com');
			expect(mockIsExclusiveNamespace).toHaveBeenCalledWith('rooms', '#general:example.com');
		});

		it('should return true when the room name falls within the exclusive `aliases` namespace', () => {
			mockIsExclusiveNamespace.mockImplementation((type, value) =>
				type === 'aliases' && value === '#irc_general:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
			);

			expect(isReservedByExclusiveBridge('room', 'irc_general')).toBe(true);
		});

		it('should return true when the room name falls within the exclusive `rooms` namespace', () => {
			mockIsExclusiveNamespace.mockImplementation((type, value) =>
				type === 'rooms' && value === '#irc_general:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
			);

			expect(isReservedByExclusiveBridge('room', 'irc_general')).toBe(true);
		});

		it('should not check the `users` namespace for a room', () => {
			mockIsExclusiveNamespace.mockReturnValue(undefined);

			isReservedByExclusiveBridge('room', 'general');

			expect(mockIsExclusiveNamespace).not.toHaveBeenCalledWith('users', expect.anything());
		});

		it('should also match against the lowercased localpart', () => {
			mockIsExclusiveNamespace.mockImplementation((_type, value) =>
				value === '#irc_general:example.com' ? ({ registration: { _id: 'irc' } } as any) : undefined,
			);

			expect(isReservedByExclusiveBridge('room', 'IRC_general')).toBe(true);
		});
	});
});
