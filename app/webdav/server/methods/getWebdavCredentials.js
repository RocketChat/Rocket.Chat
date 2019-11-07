export function getWebdavCredentials(account) {
	const cred = account.token ? { token: account.token } : {
		username: account.username,
		password: account.password,
	};
	return cred;
}
