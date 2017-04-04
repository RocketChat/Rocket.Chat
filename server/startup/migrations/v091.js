RocketChat.Migrations.add({
	version: 91,
	up() {
		const query = {
			'services.linkedin': {
				$exists: 1
			},
			$or: [{
				name: {
					$exists: 0
				}
			}, {
				name: null
			}]
		};

		RocketChat.models.Users.find(query, {'services.linkedin.firstName': 1, username: 1}).forEach((user) => {
			const name = `${ user.services.linkedin.firstName } ${ user.services.linkedin.lastName }`;

			RocketChat.models.Users.setName(user._id, name);
		});
	}
});
