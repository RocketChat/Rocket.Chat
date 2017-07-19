const loggedOut = false;

const AccountsServer = {
	async resumeSession() {
		if (loggedOut) {
			throw new Error('User not found');
		}
		// User credentials
		// mys:admin
		return RocketChat.models.Users.findOne({username: 'mys'});
	}
};

export default AccountsServer;
