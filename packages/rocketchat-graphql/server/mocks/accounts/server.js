const loggedOut = false;

const AccountsServer = {
	resumeSession: (async() => {
		if (loggedOut) {
			throw new Error('User not found');
		}
		// User credentials
		return RocketChat.models.Users.findOne({username: 'mys'});
	})
};

export default AccountsServer;
