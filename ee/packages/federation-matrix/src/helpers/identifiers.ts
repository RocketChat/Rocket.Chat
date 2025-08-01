export const convertExternalUserIdToInternalUsername = (externalUserId: string): string => externalUserId.replace(/@/g, '');
