this.toolbarSearch = {
	clear: () => {
		console.log('clear!');
		$('.toolbar').removeClass('active shortcut');
		$('.toolbar--search').val('');
	},
	focus: () => {
		console.log('focus!');
		$('.toolbar--search').val('');
		$('.toolbar--search').focus();
		$('.toolbar').removeClass('active shortcut');
	}
};

Template.toolbar.helpers({
	results() {
		return Template.instance().resultsList.get();
	}
});

Template.toolbar.events({
	'keyup .toolbar--search': (e, t) => {
		const searchVal = $(e.currentTarget).val().trim();

		const resultsFromClient = RocketChat.models.Subscriptions
			.find({name: new RegExp((RegExp.escape(searchVal)), 'i'), rid: {$ne: Session.get('openedRoom')}}, {limit: 10, sort: {unread: -1, ls: -1}}).fetch();

		t.resultsList.set(resultsFromClient);


		const resultsFromClientLength = resultsFromClient.length;
		const usernamesFromClient = [Meteor.user().username];

		for (let i = 0; i < resultsFromClientLength; i++) {
			if (resultsFromClient[i].t === 'd') {
				usernamesFromClient.push(resultsFromClient[i].name);
			}
		}

		t.getFromServer(searchVal, usernamesFromClient);
	}
});

Template.toolbar.onCreated(function() {
	this.resultsList = new ReactiveVar([]);
	this.getFromServer = _.throttle((filter, usernames) => {
		Meteor.call('spotlight', filter, usernames, (err, results) => {
			if (err) {
				console.log(err);
				return false;
			}

			const resultsFromServer = [];
			const usersLength = results.users.length;
			const roomsLength = results.rooms.length;

			if (usersLength) {
				for (let i = 0; i < usersLength; i++) {
					resultsFromServer.push({
						_id: results.users[i]._id,
						t: 'd',
						name: results.users[i].username
					});
				}
			}

			if (roomsLength) {
				for (let i = 0; i < roomsLength; i++) {
					resultsFromServer.push({
						_id: results.rooms[i]._id,
						t: results.rooms[i].t,
						name: results.rooms[i].name
					});
				}
			}

			this.resultsList.set(this.resultsList.get().concat(resultsFromServer));
		});
	}, 500);
});
