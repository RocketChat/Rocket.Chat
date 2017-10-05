RocketChat.Migrations.add({
	version: 18,
	up() {
		const changes = {
			Accounts_Facebook: 'Accounts_OAuth_Facebook',
			Accounts_Facebook_id: 'Accounts_OAuth_Facebook_id',
			Accounts_Facebook_secret: 'Accounts_OAuth_Facebook_secret',
			Accounts_Google: 'Accounts_OAuth_Google',
			Accounts_Google_id: 'Accounts_OAuth_Google_id',
			Accounts_Google_secret: 'Accounts_OAuth_Google_secret',
			Accounts_Github: 'Accounts_OAuth_Github',
			Accounts_Github_id: 'Accounts_OAuth_Github_id',
			Accounts_Github_secret: 'Accounts_OAuth_Github_secret',
			Accounts_Gitlab: 'Accounts_OAuth_Gitlab',
			Accounts_Gitlab_id: 'Accounts_OAuth_Gitlab_id',
			Accounts_Gitlab_secret: 'Accounts_OAuth_Gitlab_secret',
			Accounts_Linkedin: 'Accounts_OAuth_Linkedin',
			Accounts_Linkedin_id: 'Accounts_OAuth_Linkedin_id',
			Accounts_Linkedin_secret: 'Accounts_OAuth_Linkedin_secret',
			Accounts_Meteor: 'Accounts_OAuth_Meteor',
			Accounts_Meteor_id: 'Accounts_OAuth_Meteor_id',
			Accounts_Meteor_secret: 'Accounts_OAuth_Meteor_secret',
			Accounts_Twitter: 'Accounts_OAuth_Twitter',
			Accounts_Twitter_id: 'Accounts_OAuth_Twitter_id',
			Accounts_Twitter_secret: 'Accounts_OAuth_Twitter_secret'
		};

		for (const from of Object.keys(changes)) {
			const to = changes[from];
			const record = RocketChat.models.Settings.findOne({
				_id: from
			});

			if (record) {
				delete record._id;
				RocketChat.models.Settings.upsert({
					_id: to
				}, record);
			}

			RocketChat.models.Settings.remove({
				_id: from
			});
		}

		return ServiceConfiguration.configurations.remove({});
	}
});
