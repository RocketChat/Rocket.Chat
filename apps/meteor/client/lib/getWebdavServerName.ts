import { IWebdavAccountIntegration } from '@rocket.chat/core-typings';

export const getWebdavServerName = ({ name, serverURL, username }: Omit<IWebdavAccountIntegration, '_id'>): string =>
	name || `${username}@${serverURL?.replace(/^https?\:\/\//i, '')}`;
