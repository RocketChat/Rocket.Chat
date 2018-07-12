import _ from 'underscore';

const usersFromRoomMessages = new Mongo.Collection(null);

const reloadUsersFromRoomMessages = () => {
	usersFromRoomMessages.remove({});
	const uniqueMessageUsersControl = {};
	RocketChat.models.Messages
		.find(
			{
				rid: Session.get('openedRoom'),
				'u.username': { $ne: Meteor.user().username },
				t: { $exists: false }
			},
			{
				fields: {
					'u.username': 1,
					'u.name': 1,
					ts: 1
				},
				sort: { ts: -1 }
			}
		)
		.fetch()
		.filter(({ u: { username } }) => {
			const notMapped = !uniqueMessageUsersControl[username];
			uniqueMessageUsersControl[username] = true;
			return notMapped;
		})
		.forEach(({ u: { username, name }, ts }) => usersFromRoomMessages.upsert(username, {
			_id: username,
			username,
			name,
			status: Session.get(`user_${ username }_status`) || 'offline',
			ts
		}));
};

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.user() == null || Session.get('openedRoom') == null) {
			return;
		}

		reloadUsersFromRoomMessages();
	});
});

const fetchUsersFromServer = (filterText, records, cb, rid) => {
	const usernames = records.map(({ username }) => username);

	return Meteor.call('spotlight', filterText, usernames, { users: true }, rid, (error, results) => {
		if (error) {
			console.error(error);
			return;
		}

		const { users } = results;

		if (!users || users.length <= 0) {
			return;
		}

		users.slice(0, 5)
			.forEach(({ username }) => {
				if (records.length < 5) {
					records.push({
						_id: username,
						username,
						status: 'offline',
						sort: 3
					});
				}
			});

		records.sort(({ sort: sortA }, { sort: sortB }) => sortA - sortB);

		return cb && cb(records);
	});
};

const fetchRoomsFromServer = (filterText, records, cb, rid) => {
	if (!RocketChat.authz.hasAllPermission('view-outside-room')) {
		return cb && cb([]);
	}

	return Meteor.call('spotlight', filterText, null, { rooms: true }, rid, (error, results) => {
		if (error) {
			return console.error(error);
		}

		const { rooms } = results;

		if (!rooms || rooms.length <= 0) {
			return;
		}

		rooms.slice(0, 5).forEach(room => {
			if (records.length < 5) {
				records.push(room);
			}
		});

		return cb && cb(records);
	});
};

const fetchUsersFromServerDelayed = _.throttle(fetchUsersFromServer, 500);

const fetchRoomsFromServerDelayed = _.throttle(fetchRoomsFromServer, 500);

const addEmojiToRecents = (emoji) => {
	const pickerEl = document.querySelector('.emoji-picker');
	if (pickerEl) {
		const view = Blaze.getView(pickerEl);
		if (view) {
			Template._withTemplateInstanceFunc(view.templateInstance, () => {
				RocketChat.EmojiPicker.addRecent(emoji.replace(/:/g, ''));
			});
		}
	}
};

const emojiSort = (recents) => {
	return (a, b) => {
		let idA = a._id;
		let idB = a._id;

		if (recents.includes(a._id)) {
			idA = recents.indexOf(a._id) + idA;
		}
		if (recents.includes(b._id)) {
			idB = recents.indexOf(b._id) + idB;
		}

		if (idA < idB) {
			return -1;
		}

		if (idA > idB) {
			return 1;
		}

		return 0;
	};
};

Template.messagePopupConfig.helpers({
	popupUserConfig() {
		const self = this;
		const config = {
			title: t('People'),
			collection: usersFromRoomMessages,
			template: 'messagePopupUser',
			getInput: self.getInput,
			textFilterDelay: 200,
			trigger: '@',
			suffix: ' ',
			getFilter(collection, filterText, cb) {
				filterText = filterText && filterText.trim() || '';
				let exp = new RegExp(`${ RegExp.escape(filterText) }`, 'i');

				// Get at least 5 users from messages sent on room
				const items = usersFromRoomMessages
					.find(
						{
							ts: { $exists: true },
							$or: [
								{ username: exp },
								{ name: exp }
							]
						},
						{
							limit: 5,
							sort: { ts: -1 }
						}
					)
					.fetch();

				// If needed, add to list the online users
				if (items.length < 5 && filterText !== '') {
					const messageUsers = items.map(({ username }) => username);
					const user = Meteor.user();

					if (!RocketChat.authz.hasAllPermission('view-outside-room')) {
						const usernames = RocketChat.models.Subscriptions
							.find(
								{
									t: 'd',
									$or: [
										{ name: exp },
										{ fname: exp }
									]
								}
							)
							.fetch()
							.map(({ name }) => name);
						const newItems = RocketChat.models.Users
							.find(
								{
									username: { $in: usernames }
								},
								{
									fields: {
										username: 1,
										name: 1,
										status: 1
									}
								},
								{ limit: 5 - messageUsers.length }
							)
							.fetch()
							.map(({ username, name, status }) => ({
								_id: username,
								username,
								name,
								status,
								sort: 1
							}));

						items.push(...newItems);
					} else {
						const newItems = Meteor.users
							.find(
								{
									$and: [
										{
											$or: [
												{ username: exp },
												{ name: exp }
											]
										},
										{
											username: {
												$nin: [
													user && user.username,
													...messageUsers
												]
											}
										}
									]
								},
								{ limit: 5 - messageUsers.length }
							)
							.fetch()
							.map(({ username, name, status }) => ({
								_id: username,
								username,
								name,
								status,
								sort: 1
							}));

						items.push(...newItems);
					}
				}

				// Get users from db
				if (items.length < 5 && filterText !== '') {
					fetchUsersFromServerDelayed(filterText, items, cb, RocketChat.openedRoom);
				}

				const all = {
					_id: 'all',
					username: 'all',
					system: true,
					name: t('Notify_all_in_this_room'),
					compatibility: 'channel group',
					sort: 4
				};

				exp = new RegExp(`(^|\\s)${ RegExp.escape(filterText) }`, 'i');
				if (exp.test(all.username) || exp.test(all.compatibility)) {
					items.push(all);
				}
				const here = {
					_id: 'here',
					username: 'here',
					system: true,
					name: t('Notify_active_in_this_room'),
					compatibility: 'channel group',
					sort: 4
				};
				if (exp.test(here.username) || exp.test(here.compatibility)) {
					items.push(here);
				}
				return items;
			},
			getValue(_id) {
				return _id;
			}
		};
		return config;
	},
	popupChannelConfig() {
		const self = this;
		const config = {
			title: t('Channels'),
			collection: RocketChat.models.Subscriptions,
			trigger: '#',
			suffix: ' ',
			template: 'messagePopupChannel',
			getInput: self.getInput,
			getFilter(collection, filter, cb) {
				const exp = new RegExp(filter, 'i');
				const records = collection.find({
					name: exp,
					t: {
						$in: ['c', 'p']
					}
				}, {
					limit: 5,
					sort: {
						ls: -1
					}
				}).fetch();

				if (records.length < 5 && filter && filter.trim() !== '') {
					fetchRoomsFromServerDelayed(filter, records, cb, RocketChat.openedRoom);
				}
				return records;
			},
			getValue(_id, collection, records) {
				const record = _.findWhere(records, {
					_id
				});
				return record && record.name;
			}
		};
		return config;
	},
	popupSlashCommandsConfig() {
		const self = this;
		const config = {
			title: t('Commands'),
			collection: RocketChat.slashCommands.commands,
			trigger: '/',
			suffix: ' ',
			triggerAnywhere: false,
			template: 'messagePopupSlashCommand',
			getInput: self.getInput,
			getFilter(collection, filter) {
				return Object.keys(collection).map(command => {
					const item = collection[command];
					return {
						_id: command,
						params: item.params ? TAPi18n.__(item.params) : '',
						description: TAPi18n.__(item.description),
						permission: item.permission
					};
				}).filter(command => {
					const isMatch = command._id.indexOf(filter) > -1;

					if (!isMatch) {
						return false;
					}

					if (!command.permission) {
						return true;
					}

					return RocketChat.authz.hasAtLeastOnePermission(command.permission, Session.get('openedRoom'));
				}).sort((a, b) => a._id > b._id).slice(0, 11);
			}
		};
		return config;
	},
	emojiEnabled() {
		return RocketChat.emoji != null;
	},
	popupEmojiConfig() {
		if (RocketChat.emoji != null) {
			const self = this;
			return {
				title: t('Emoji'),
				collection: RocketChat.emoji.list,
				template: 'messagePopupEmoji',
				trigger: ':',
				prefix: '',
				suffix: ' ',
				getInput: self.getInput,
				getFilter(collection, filter) {
					const key = `:${ filter }`;

					if (!RocketChat.getUserPreference(Meteor.user(), 'useEmojis')) {
						return [];
					}

					if (!RocketChat.emoji.packages.emojione || RocketChat.emoji.packages.emojione.asciiList[key]) {
						return [];
					}

					const regExp = new RegExp(`^${ RegExp.escape(key) }`, 'i');
					const recents = RocketChat.EmojiPicker.getRecent().map(item => `:${ item }:`);
					return Object.keys(collection).map(key => {
						const value = collection[key];
						return {
							_id: key,
							data: value
						};
					})
						.filter(obj => regExp.test(obj._id))
						.sort(emojiSort(recents))
						.slice(0, 10);
				},
				getValue(_id) {
					addEmojiToRecents(_id);
					return _id;
				}
			};
		}
	},
	popupReactionEmojiConfig() {
		if (RocketChat.emoji != null) {
			const self = this;
			return {
				title: t('Emoji'),
				collection: RocketChat.emoji.list,
				template: 'messagePopupEmoji',
				trigger: '\\+',
				prefix: '+',
				suffix: ' ',
				getInput: self.getInput,
				getFilter(collection, filter) {
					const key = `${ filter }`;

					if (!RocketChat.emoji.packages.emojione || RocketChat.emoji.packages.emojione.asciiList[key]) {
						return [];
					}

					const regExp = new RegExp(`^${ RegExp.escape(key) }`, 'i');
					const recents = RocketChat.EmojiPicker.getRecent().map(item => `:${ item }:`);
					return Object.keys(collection).map(key => {
						const value = collection[key];
						return {
							_id: key,
							data: value
						};
					})
						.filter(obj => regExp.test(obj._id))
						.sort(emojiSort(recents))
						.slice(0, 10);
				},
				getValue(_id) {
					addEmojiToRecents(_id);
					return _id;
				}
			};
		}
	}
});
