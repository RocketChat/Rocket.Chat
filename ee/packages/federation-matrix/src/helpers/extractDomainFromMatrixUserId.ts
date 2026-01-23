export const extractDomainFromMatrixUserId = (mxid: string): string => {
	const separatorIndex = mxid.indexOf(':', 1);
	if (separatorIndex === -1) {
		throw new Error(`Invalid federated username: ${mxid}`);
	}
	return mxid.substring(separatorIndex + 1);
};
