import { WebdavAccountIntegration } from '../../definition/IWebdavAccount';

export const getWebdavServerName = ({ name, serverURL, username }: Omit<WebdavAccountIntegration, '_id'>): string =>
	name || `${username}@${serverURL?.replace(/^https?\:\/\//i, '')}`;
