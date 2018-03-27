/* globals filteredUsersMemory */
import _ from 'underscore';

filteredUsersMemory = new Mongo.Collection(null);

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.user() == null || Session.get('openedRoom') == null) {
			return;
		}
		filteredUsersMemory.remove({});
		const messageUsers = RocketChat.models.Messages.find({
			rid: Session.get('openedRoom'),
			'u.username': {
				$ne: Meteor.user().username
			}
		}, {
			fields: {
				'u.username': 1,
				'u.name': 1,
				ts: 1
			},
			sort: {
				ts: -1
			}
		}).fetch();
		const uniqueMessageUsersControl = {};
		return messageUsers.forEach(function(messageUser) {
			if (uniqueMessageUsersControl[messageUser.u.username] == null) {
				uniqueMessageUsersControl[messageUser.u.username] = true;
				return filteredUsersMemory.upsert(messageUser.u.username, {
					_id: messageUser.u.username,
					username: messageUser.u.username,
					name: messageUser.u.name,
					status: Session.get(`user_${ messageUser.u.username }_status`) || 'offline',
					ts: messageUser.ts
				});
			}
		});
	});
});

const getUsersFromServer = (filter, records, cb, rid) => {
	const messageUsers = _.pluck(records, 'username');
	return Meteor.call('spotlight', filter, messageUsers, {
		users: true
	}, rid, function(err, results) {
		if (err != null) {
			return console.error(err);
		}
		if (results.users.length > 0) {
			results.users.forEach(result => {
				if (records.length < 5) {
					records.push({
						_id: result.username,
						username: result.username,
						status: 'offline',
						sort: 3
					});
				}
			});
			records = _.sortBy(records, 'sort');
			return cb(records);
		}
	});
};

const getRoomsFromServer = (filter, records, cb, rid) => {
	if (!RocketChat.authz.hasAllPermission('view-outside-room')) {
		return cb([]);
	}
	return Meteor.call('spotlight', filter, null, {
		rooms: true
	}, rid, function(err, results) {
		if (err != null) {
			return console.error(err);
		}
		if (results.rooms.length > 0) {
			results.rooms.forEach(room => {
				if (records.length < 5) {
					records.push(room);
				}
			});
			return cb(records);
		}
	});
};

const getUsersFromServerDelayed = _.throttle(getUsersFromServer, 500);

const getRoomsFromServerDelayed = _.throttle(getRoomsFromServer, 500);

const addEmojiToRecents = (emoji) => {
	const pickerEl = $('.emoji-picker')[0];
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
			collection: filteredUsersMemory,
			template: 'messagePopupUser',
			getInput: self.getInput,
			textFilterDelay: 200,
			trigger: '@',
			suffix: ' ',
			getFilter(collection, filter, cb) {
				let exp = new RegExp(`${ RegExp.escape(filter) }`, 'i');
				// Get users from messages
				const items = filteredUsersMemory.find({
					ts: {
						$exists: true
					},
					$or: [
						{
							username: exp
						}, {
							name: exp
						}
					]
				}, {
					limit: 5,
					sort: {
						ts: -1
					}
				}).fetch();
				// Get online users
				if (items.length < 5 && filter && filter.trim() !== '') {
					const messageUsers = _.pluck(items, 'username');
					const user = Meteor.user();
					if (!RocketChat.authz.hasAllPermission('view-outside-room')) {
						const usernames = RocketChat.models.Subscriptions.find({$or :[{'name': exp}, { fname: exp}]}).fetch().map(({name}) =>name);
						items.push(...
							RocketChat.models.Users.find({username:{$in:usernames}}, {fields:{
								username: 1,
								name: 1,
								status: 1
							}}, {
								limit: 5 - messageUsers.length
							}).fetch().map(({username, name, status}) => ({ _id: username, username, name, status, sort: 1 }))
						);
					} else {
						items.push(...Meteor.users.find({
							$and: [
								{
									$or: [
										{
											username: exp
										}, {
											name: exp
										}
									]
								}, {
									username: {
										$nin: [(user && user.username), ...messageUsers]
									}
								}
							]
						}, {
							limit: 5 - messageUsers.length
						}).fetch().map(({username, name, status}) => ({ _id: username, username, name, status, sort: 1 })));
					}
				}
				// Get users from db
				if (items.length < 5 && filter && filter.trim() !== '') {
					getUsersFromServerDelayed(filter, items, cb, RocketChat.openedRoom);
				}
				const all = {
					_id: 'all',
					username: 'all',
					system: true,
					name: t('Notify_all_in_this_room'),
					compatibility: 'channel group',
					sort: 4
				};
				exp = new RegExp(`(^|\\s)${ RegExp.escape(filter) }`, 'i');
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
					getRoomsFromServerDelayed(filter, records, cb, RocketChat.openedRoom);
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
