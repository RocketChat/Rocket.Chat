Meteor.methods({
	'chatpalUtilsCreateKey'(email) {
		try {
			const response = HTTP.call('POST', 'https://beta.chatpal.io/v1/account', {data: {email, tier: 'free'}});
			if (response.statusCode === 201) {
				return response.data.key;
			} else {
				return false;
			}
		} catch (e) {
			return false;
		}
	}
});
