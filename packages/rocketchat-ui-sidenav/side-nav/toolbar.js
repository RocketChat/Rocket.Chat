this.toolbarSearch = {
	clear: () => {
		$('.toolbar--search').val('');
	},
	focus: () => {
		$('.toolbar--search').val('');
		$('.toolbar--search').focus();
	}
};

const getFromServer = (filter, usernames, records, cb) => {
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

		if (resultsFromServer.length) {
			cb(records.concat(resultsFromServer));
		}
	});
};

const getFromServerDelayed = _.throttle(getFromServer, 500);

Template.toolbar.helpers({
	results() {
		return Template.instance().resultsList.get();
	},
	popupConfig() {
		const config = {
			cls: 'search-results-list',
			collection: RocketChat.models.Subscriptions,
			template: 'spotlightTemplate',
      		input: '.toolbar--search',
			getFilter: function(collection, filter, cb) {
				const resultsFromClient = collection.find({name: new RegExp((RegExp.escape(filter)), 'i'), rid: {$ne: Session.get('openedRoom')}}, {limit: 10, sort: {unread: -1, ls: -1}}).fetch();

				const resultsFromClientLength = resultsFromClient.length;
				const usernamesFromClient = [Meteor.user().username];

				for (let i = 0; i < resultsFromClientLength; i++) {
					if (resultsFromClient[i].t === 'd') {
						usernamesFromClient.push(resultsFromClient[i].name);
					}
				}

				cb(resultsFromClient);

				getFromServerDelayed(filter, usernamesFromClient, resultsFromClient, cb);
			},
			getValue: function(_id, collection, records) {
				const doc = _.findWhere(records, {_id: _id});

				RocketChat.roomTypes.openRouteLink(doc.t, doc, FlowRouter.current().queryParams);
				toolbarSearch.hide();
      		}
		};

		return config;
	}
});

// Template.toolbar.events({
// 	'keyup .toolbar--search, change .toolbar--search': (e, t) => {
// 		const searchVal = $(e.currentTarget).val().trim();

// 		if (!$('.toolbar').hasClass('shortcut')) {
// 			if (searchVal === '') {
// 				$('.toolbar').removeClass('active');
// 				t.resultsList.set([]);
// 				return false;
// 			}
// 		}

// 		$('.toolbar').addClass('active');

// 		const resultsFromClient = RocketChat.models.Subscriptions
// 			.find({name: new RegExp((RegExp.escape(searchVal)), 'i'), rid: {$ne: Session.get('openedRoom')}}, {limit: 10, sort: {unread: -1, ls: -1}}).fetch();

// 		t.resultsList.set(resultsFromClient);


// 		const resultsFromClientLength = resultsFromClient.length;
// 		const usernamesFromClient = [Meteor.user().username];

// 		for (let i = 0; i < resultsFromClientLength; i++) {
// 			if (resultsFromClient[i].t === 'd') {
// 				usernamesFromClient.push(resultsFromClient[i].name);
// 			}
// 		}

// 		t.getFromServer(searchVal, usernamesFromClient);
// 	}
// });

// Template.toolbar.onCreated(function() {
// 	this.resultsList = new ReactiveVar([]);
// 	this.getFromServer = _.throttle((filter, usernames) => {
// 		Meteor.call('spotlight', filter, usernames, (err, results) => {
// 			if (err) {
// 				console.log(err);
// 				return false;
// 			}

// 			const resultsFromServer = [];
// 			const usersLength = results.users.length;
// 			const roomsLength = results.rooms.length;

// 			if (usersLength) {
// 				for (let i = 0; i < usersLength; i++) {
// 					resultsFromServer.push({
// 						_id: results.users[i]._id,
// 						t: 'd',
// 						name: results.users[i].username
// 					});
// 				}
// 			}

// 			if (roomsLength) {
// 				for (let i = 0; i < roomsLength; i++) {
// 					resultsFromServer.push({
// 						_id: results.rooms[i]._id,
// 						t: results.rooms[i].t,
// 						name: results.rooms[i].name
// 					});
// 				}
// 			}

// 			this.resultsList.set(this.resultsList.get().concat(resultsFromServer));
// 			console.log(this.resultsList.get());
// 		});
// 	}, 500);
// });
