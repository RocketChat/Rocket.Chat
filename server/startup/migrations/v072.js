import { Migrations } from 'meteor/rocketchat:migrations';
import { Users } from 'meteor/rocketchat:models';

Migrations.add({
	version: 72,
	up() {
		Users.find({ type: 'visitor', 'emails.address': { $exists: true } }, { emails: 1 }).forEach(function(visitor) {
			Users.update({ _id: visitor._id }, {
				$set: {
					visitorEmails: visitor.emails,
				},
				$unset: {
					emails: 1,
				},
			});
		});
	},
});
