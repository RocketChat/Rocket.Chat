import { extractDomainFromMatrixUserId } from './extractDomainFromMatrixUserId';

/**
 * Extract the username and the servername from a matrix user id
 * if the serverName is the same as the serverName in the mxid, return only the username (rocket.chat regular username)
 * otherwise, return the full mxid and the servername
 */

export const getUsernameServername = (mxid: string, serverName: string): [mxid: string, serverName: string, isLocal: boolean] => {
	const senderServerName = extractDomainFromMatrixUserId(mxid);
	// if the serverName is the same as the serverName in the mxid, return only the username (rocket.chat regular username)
	if (serverName === senderServerName) {
		const separatorIndex = mxid.indexOf(':', 1);
		if (separatorIndex === -1) {
			throw new Error(`Invalid federated username: ${mxid}`);
		}
		return [mxid.substring(1, separatorIndex), senderServerName, true]; // removers also the @
	}

	return [mxid, senderServerName, false];
};
