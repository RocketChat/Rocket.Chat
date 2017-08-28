let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

Meteor.methods({
	getPublicTokenpassBalances(accessToken) {
		try {
			this.unblock();
			return HTTP.get(
				'https://tokenpass.tokenly.com/api/v1/tca/public/balances', {
					headers: {
						Accept: 'application/json',
						'User-Agent': userAgent
					},
					params: {
						oauth_token: accessToken
					}
				}).data;
		} catch (error) {
			throw new Error(`Failed to fetch public tokenpass balances from Tokenly. ${ error.message }`);
		}
	},

	getProtectedTokenpassBalances(accessToken) {
		try {
			this.unblock();
			return HTTP.get(
				'https://tokenpass.tokenly.com/api/v1/tca/protected/balances', {
					headers: {
						Accept: 'application/json',
						'User-Agent': userAgent
					},
					params: {
						oauth_token: accessToken
					}
				}).data;
		} catch (error) {
			throw new Error(`Failed to fetch protected tokenpass balances from Tokenly. ${ error.message }`);
		}
	}
});
