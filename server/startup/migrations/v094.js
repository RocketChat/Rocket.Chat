RocketChat.Migrations.add({
	version: 94,
	up() {
		const query = {
			'emails.address.address': { $exists: true }
		};

		RocketChat.models.Users.find(query, {'emails.address.address': 1}).forEach((user) => {
			let emailAddress;
			user.emails.some(email => {
				if (email.address && email.address.address) {
					emailAddress = email.address.address;
					return true;
				}
			});
			const existingUser = RocketChat.models.Users.findOne({ 'emails.address': emailAddress }, { fields: { _id: 1 } });
			if (existingUser) {
				RocketChat.models.Users.update({
					_id: user._id,
					'emails.address.address': emailAddress
				}, {
					$unset: {
						'emails.$': 1
					}
				});
			} else {
				RocketChat.models.Users.update({
					_id: user._id,
					'emails.address.address': emailAddress
				}, {
					$set: {
						'emails.$.address': emailAddress
					}
				});
			}
		});
	}
});
