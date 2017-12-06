import LivechatVisitors from 'meteor/rocketchat:livechat/server/models/LivechatVisitors';

RocketChat.Migrations.add({
	version: 105,
	up() {
		const visitors = Meteor.users.find({ type: 'visitor' });
		const total = visitors.count();
		let current = 1;

		console.log('Migrating livechat visitors, this may take a while ...');

		Meteor.setTimeout(() => {
			visitors.forEach(user => {
				console.log(`Migrating visitor ${ current++ }/${ total }`);

				const {
					_id,
					name,
					username,
					deparment,
					userAgent,
					ip,
					host,
					visitorEmails,
					phone
				} = user;
				LivechatVisitors.insert({
					_id,
					name,
					username,
					deparment,
					userAgent,
					ip,
					host,
					visitorEmails,
					phone,
					token: user.profile.token
				});

				Meteor.users.remove({ _id });
			});

			console.log('Livechat visitors migration finished.');
		}, 1000);
	}
});
