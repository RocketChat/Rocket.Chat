import type { RoomID, UserID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';

import { MatrixRTCTokenError } from './errors';

const logger = new Logger('MatrixRTCTokens');

const verifyingMembership = async (roomId: string, check: () => Promise<boolean>): Promise<boolean> => {
	try {
		return await check();
	} catch (err) {
		logger.error({ msg: 'Could not check who is joined to a room', roomId, err });
		throw new MatrixRTCTokenError(502, 'M_UNKNOWN', 'Unable to verify room membership');
	}
};

/** Whether a user is joined to a room, as this server sees it: nobody is, in a room this server does not know. */
export const isUserJoined = (roomId: string, userId: string): Promise<boolean> =>
	verifyingMembership(roomId, () => federationSDK.isUserJoined(roomId as RoomID, userId as UserID));

/** Whether a homeserver has users joined to a room, as this server sees it. */
export const isServerJoined = (roomId: string, serverName: string): Promise<boolean> =>
	verifyingMembership(roomId, async () => (await federationSDK.getJoinedServers(roomId as RoomID)).includes(serverName));
