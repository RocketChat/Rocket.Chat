import { ServerCredentials } from '../lib/webdavClientAdapter';

export function getWebdavCredentials(account: ServerCredentials): ServerCredentials {
	const cred = account.token
		? { token: account.token }
		: {
				username: account.username,
				password: account.password,
		  };
	return cred;
}
