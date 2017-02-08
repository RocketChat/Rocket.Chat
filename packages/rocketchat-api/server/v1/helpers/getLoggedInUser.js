RocketChat.API.v1.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
	let token;
	let user;

	if (this.request.headers['x-auth-token']) {
		token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
		user = RocketChat.models.Users.findOne({'services.resume.loginTokens.hashedToken': token});
	}

	return user;
});

// const auth = function _auth () {
// 	const invalidResults = [undefined, null, false];
// 	return {
// 		token: 'services.resume.loginTokens.hashedToken',
// 		user: function(headerId, headerToken) {


// 			let token;
// 			if (headerToken) {
// 				token = Accounts._hashLoginToken(headerToken);
// 			}

// 			return {
// 				userId: headerId,
// 				token
// 			};
// 		}
// 	};
// }
