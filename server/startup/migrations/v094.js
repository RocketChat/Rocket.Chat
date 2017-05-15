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
			RocketChat.models.Users.update({
				_id: user._id,
				'emails.address.address': emailAddress
			}, {
				$set: {
					'emails.$.address': emailAddress
				}
			});
		});
	}
});
