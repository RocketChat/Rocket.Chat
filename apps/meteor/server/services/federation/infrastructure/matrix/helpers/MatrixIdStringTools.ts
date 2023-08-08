export const removeExternalSpecificCharsFromExternalIdentifier = (matrixId = ''): string => {
	return matrixId.replace('@', '').replace('!', '').replace('#', '');
};

export const formatExternalUserIdToInternalUsernameFormat = (matrixId = ''): string => {
	return matrixId.split(':')[0]?.replace('@', '');
};

export const formatExternalAliasIdToInternalFormat = (alias = ''): string => {
	return alias.split(':')[0]?.replace('#', '');
};

export const isAnExternalIdentifierFormat = (identifier: string): boolean => identifier.includes(':');

export const isAnExternalUserIdFormat = (userId: string): boolean => isAnExternalIdentifierFormat(userId) && userId.includes('@');

export const extractServerNameFromExternalIdentifier = (identifier = ''): string => {
	const splitted = identifier.split(':');

	return splitted.length > 1 ? splitted[1] : '';
};

export const extractUserIdAndHomeserverFromMatrixId = (matrixId = ''): string[] => {
	return matrixId.replace('@', '').split(':');
};
