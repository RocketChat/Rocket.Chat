export const formatUsernameAndDomainIntoMatrixFormat = (username: string, domain: string): string => `${username}:${domain}`;

export const formatIntoFullMatrixUsername = (username: string, domain: string): string =>
	`@${formatUsernameAndDomainIntoMatrixFormat(username, domain)}`;
