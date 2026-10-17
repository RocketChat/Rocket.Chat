import { Logger } from '@rocket.chat/logger';

import { MatrixRTCTokenError } from './errors';
import type { IMatrixRTCLiveKitIssuer, MatrixRTCOwnTransport } from '../issuer';
import { getMatrixRTCLiveKitIssuer } from '../issuer';

const logger = new Logger('MatrixRTCTokens');

/** This server's SFU and what mints tokens for it, while LiveKit is configured. */
export const getOwnSFU = (): { issuer: IMatrixRTCLiveKitIssuer; transport: MatrixRTCOwnTransport } | undefined => {
	const issuer = getMatrixRTCLiveKitIssuer();
	const transport = issuer?.getOwnTransport();

	return issuer && transport ? { issuer, transport } : undefined;
};

/**
 * A token for a member of another homeserver to watch this server's SFU without publishing on it. Not hidden: MSC4195
 * wants every participant visible, so nobody watches unnoticed.
 */
export async function mintRemoteMemberToken(issuer: IMatrixRTCLiveKitIssuer, roomName: string, identity: string): Promise<string> {
	try {
		return await issuer.mintToken({ roomName, identity, canPublish: false });
	} catch (err) {
		logger.error({ msg: 'Failed to mint a LiveKit token for a member of another homeserver', roomName, err });
		throw new MatrixRTCTokenError(500, 'M_UNKNOWN', 'Internal Server Error');
	}
}

/** The homeserver a Matrix user id belongs to; nothing for a malformed id. */
export const serverNameOfUserId = (userId: string): string | undefined => {
	const match = /^@([^:]+):(.+)$/.exec(userId);
	return match?.[2];
};
