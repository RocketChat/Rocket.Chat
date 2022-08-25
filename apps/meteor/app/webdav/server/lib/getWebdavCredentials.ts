import type { WebDAVClientOptions } from 'webdav';

export function getWebdavCredentials(account: WebDAVClientOptions): WebDAVClientOptions {
	const cred = account.token
		? { token: account.token }
		: {
				username: account.username,
				password: account.password,
		  };
	return cred;
}
