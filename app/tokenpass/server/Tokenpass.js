export const Tokenpass = {
	validateAccess(tokenpass, balances) {
		const compFunc = tokenpass.require === 'any' ? 'some' : 'every';
		return tokenpass.tokens[compFunc]((config) =>
			balances.some((userToken) => config.token === userToken.asset && parseFloat(config.balance) <= parseFloat(userToken.balance)),
		);
	},
};
