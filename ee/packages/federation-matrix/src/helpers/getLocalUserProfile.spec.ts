import { federationSDK } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';

import { getLocalUserProfile } from './getLocalUserProfile';

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOne: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
	},
	extractDomainFromId: (id: string) => id.substring(id.indexOf(':') + 1),
}));

const mockFindOne = Users.findOne as jest.Mock;
const mockGetConfig = federationSDK.getConfig as jest.Mock;

const ownedUserFilter = [{ federated: { $exists: false } }, { federated: false }, { 'federation.asId': { $exists: true } }];

describe('getLocalUserProfile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetConfig.mockReturnValue('local.com');
	});

	it('should return null without querying for a user id on another homeserver', async () => {
		await expect(getLocalUserProfile('@alice:remote.com')).resolves.toBeNull();
		expect(mockFindOne).not.toHaveBeenCalled();
	});

	it('should look up application service users by their full user id first', async () => {
		mockFindOne.mockResolvedValueOnce({ username: '@xmpp:local.com', name: 'XMPP bridge' });

		await expect(getLocalUserProfile('@xmpp:local.com')).resolves.toEqual({ displayname: 'XMPP bridge' });
		expect(mockFindOne).toHaveBeenCalledTimes(1);
		expect(mockFindOne).toHaveBeenCalledWith(
			{ username: '@xmpp:local.com', $or: ownedUserFilter },
			{ projection: { username: 1, name: 1, avatarETag: 1 } },
		);
	});

	it('should fall back to the localpart for native users', async () => {
		mockFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ username: 'alice', name: 'Alice', avatarETag: 'etag123' });

		await expect(getLocalUserProfile('@alice:local.com')).resolves.toEqual({
			displayname: 'Alice',
			avatar_url: 'mxc://local.com/etag123',
		});
		expect(mockFindOne).toHaveBeenNthCalledWith(2, { username: 'alice', $or: ownedUserFilter }, expect.anything());
	});

	it('should use the username as displayname when the user has no name', async () => {
		mockFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ username: 'alice', name: '' });

		await expect(getLocalUserProfile('@alice:local.com')).resolves.toEqual({ displayname: 'alice' });
	});

	it('should return null when no owned user matches', async () => {
		mockFindOne.mockResolvedValue(null);

		await expect(getLocalUserProfile('@ghost:local.com')).resolves.toBeNull();
		expect(mockFindOne).toHaveBeenCalledTimes(2);
	});
});
