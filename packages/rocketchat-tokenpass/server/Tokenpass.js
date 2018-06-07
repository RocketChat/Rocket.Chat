RocketChat.Tokenpass = {
	validateAccess(tokenpass, balances) {
		const compFunc = tokenpass.require === 'any' ? 'some' : 'every';
		return tokenpass.tokens[compFunc]((config) => {
			return balances.some(userToken => {
				return config.token === userToken.asset && parseFloat(config.balance) <= parseFloat(userToken.balance);
			});
		});
	}
};
