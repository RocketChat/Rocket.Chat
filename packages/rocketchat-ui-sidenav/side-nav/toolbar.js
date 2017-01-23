const toolbarSearch = {
	clear: () => {
		$('.toolbar-search__input').val('');
		console.log('clear');
	},
	focus: () => {
		$('.toolbar-search__input').val('');
		$('.toolbar-search__input').focus();
	}
};

this.toolbarSearch = toolbarSearch;

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
			template: 'toolbarSearchList',
      		input: '.toolbar-search__input',
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
				// toolbarSearch.clear();
      		}
		};

		return config;
	}
});

Template.toolbar.events({
	'click .toolbar-search__icon--cancel': () => {
		$('.toolbar-search__input').trigger({
			type: 'keyup',
			which: 27
		});
		toolbarSearch.clear();
	}
});

Template.toolbarSearchList.helpers({
	icon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},

	userStatus() {
		if (this.t === 'd') {
			return 'status-' + (Session.get(`user_${this.name}_status`) || 'offline');
		} else {
			return 'status-' + (RocketChat.roomTypes.getUserStatus(this.t, this.rid || this._id) || 'offline');
		}
	}
});
