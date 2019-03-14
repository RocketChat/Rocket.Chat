import { Migrations } from '/app/migrations';
import { Users } from '/app/models';

Migrations.add({
	version: 94,
	up() {
		const query = {
			'emails.address.address': { $exists: true },
		};

		Users.find(query, { 'emails.address.address': 1 }).forEach((user) => {
			let emailAddress;
			user.emails.some((email) => {
				if (email.address && email.address.address) {
					emailAddress = email.address.address;
					return true;
				}
				return false;
			});
			const existingUser = Users.findOne({ 'emails.address': emailAddress }, { fields: { _id: 1 } });
			if (existingUser) {
				Users.update({
					_id: user._id,
					'emails.address.address': emailAddress,
				}, {
					$unset: {
						'emails.$': 1,
					},
				});
			} else {
				Users.update({
					_id: user._id,
					'emails.address.address': emailAddress,
				}, {
					$set: {
						'emails.$.address': emailAddress,
					},
				});
			}
		});
	},
});
