// TODO: resolve the fname
// RocketChat.models.Subscriptions.cache.hasOne('Users', {
// 	field: 'fname',
// 	link: {
// 		local: 'name',
// 		remote: 'username',
// 		where(subscription/*, user*/) {
// 			return subscription.t === 'd';
// 		},
// 		transform(subscription, user) {
// 			if (user == null || subscription == null) {
// 				return undefined;
// 			}
// 			// Prevent client cache for old subscriptions with new names
// 			// Cuz when a user change his name, the subscription's _updateAt
// 			// will not change
// 			if (subscription._updatedAt < user._updatedAt) {
// 				subscription._updatedAt = user._updatedAt;
// 			}
// 			return user.name;
// 		}
// 	}
// });
