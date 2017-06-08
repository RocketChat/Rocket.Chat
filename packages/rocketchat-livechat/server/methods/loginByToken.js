import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:loginByToken'(token) {
		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!user) {
			return;
		}

		return {
			_id: user._id
		};

		// const stampedToken = Accounts._generateStampedLoginToken();
		// const hashStampedToken = Accounts._hashStampedToken(stampedToken);

		// const updateUser = {
		// 	$set: {
		// 		services: {
		// 			resume: {
		// 				loginTokens: [ hashStampedToken ]
		// 			}
		// 		}
		// 	}
		// };

		// Meteor.users.update(user._id, updateUser);

		// return {
		// 	token: stampedToken.token
		// };
	}
});
