// If user are registered it tells your Tokenpass username and the number of your token types associated

RocketChat.getTokenpassUserAccountResume = function(user) {
	const balances = RocketChat.updateUserTokenpassBalances(user);

	return {
		username: user.services.tokenpass.username,
		numberOfTokens: (balances && balances.length) || 0
	};
};
