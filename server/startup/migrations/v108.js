RocketChat.Migrations.add({
	version: 108,
	up() {
		/*
		 * Move visitor navigation history to messages
		 */
		let token = '';
		let roomId;

		console.log('Migrating livechat visitors navigation history to livechat messages ...');

		Meteor.setTimeout(() => {
			RocketChat.models.LivechatPageVisited.find({}).forEach((item) => {

				if (token !== item.token) {
					const rooms = RocketChat.models.Rooms.findByVisitorToken(item.token).fetch();
					if ((rooms) && (rooms.length > 0)) {
						roomId = rooms[0]._id;
					} else {
						roomId = null;
					}
					token = item.token;
				}
				if (roomId) {
					const pageTitle = item.page.title;
					const pageUrl = item.page.location.href;
					const msg = {
						t: 'livechat_navigation_history',
						rid: roomId,
						ts: item.ts,
						msg: `${ pageTitle } - ${ pageUrl }`,
						u: {
							_id : 'rocket.cat',
							username : 'rocket.cat'
						},
						groupable : false,
						navigation : {
							page: item.page,
							token: item.token
						}
					};
					RocketChat.models.Messages.insert(msg);
				}
				RocketChat.models.LivechatPageVisited.remove({_id: item._id});
			});

			console.log('Livechat visitors navigation history migration finished.');
		}, 1000);
	}
});
