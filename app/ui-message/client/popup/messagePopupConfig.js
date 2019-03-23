import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { Messages, Subscriptions, Users } from '../../../models';
import { hasAllPermission, hasAtLeastOnePermission } from '../../../authorization';
import { EmojiPicker, emoji } from '../../../emoji';
import { RoomManager } from '../../../ui-utils';
import { t, getUserPreference, slashCommands } from '../../../utils';
import _ from 'underscore';

const usersFromRoomMessages = new Mongo.Collection(null);

const reloadUsersFromRoomMessages = (fromUsername, rid) => {
	usersFromRoomMessages.remove({});
	const uniqueMessageUsersControl = {};

	Messages.find({
		rid,
		'u.username': { $ne: fromUsername },
		t: { $exists: false },
	},
	{
		fields: {
			'u.username': 1,
			'u.name': 1,
			ts: 1,
		},
		sort: { ts: -1 },
	}).fetch()
		.filter(({ u: { username } }) => {
			const notMapped = !uniqueMessageUsersControl[username];
			uniqueMessageUsersControl[username] = true;
			return notMapped;
		})
		.forEach(({ u: { username, name }, ts }) => usersFromRoomMessages.upsert(username, {
			_id: username,
			username,
			name,
			status: Tracker.nonreactive(() => Session.get(`user_${ username }_status`) || 'offline'),
			ts,
		}));
};

Meteor.startup(function() {
	Tracker.autorun(function() {
		const userId = Meteor.userId();
		const rid = Session.get('openedRoom');

		if (!userId || !rid) {
			return;
		}

		const user = Meteor.users.findOne(userId, { fields: { username: 1 } });
		if (!user || !user.username) {
			return;
		}

		reloadUsersFromRoomMessages(user.username, rid);
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
			.forEach(({ username, name, status }) => {
				if (records.length < 5) {
					records.push({
						_id: username,
						username,
						name,
						status,
						sort: 3,
					});
				}
			});

		records.sort(({ sort: sortA }, { sort: sortB }) => sortA - sortB);

		return cb && cb(records);
	});
};

const fetchRoomsFromServer = (filterText, records, cb, rid) => {
	if (!hasAllPermission('view-outside-room')) {
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

		rooms.slice(0, 5).forEach((room) => {
			if (records.length < 5) {
				records.push(room);
			}
		});

		return cb && cb(records);
	});
};

const fetchUsersFromServerDelayed = _.throttle(fetchUsersFromServer, 1000);

const fetchRoomsFromServerDelayed = _.throttle(fetchRoomsFromServer, 1000);

const addEmojiToRecents = (emoji) => {
	const pickerEl = document.querySelector('.emoji-picker');
	if (pickerEl) {
		const view = Blaze.getView(pickerEl);
		if (view) {
			Template._withTemplateInstanceFunc(view.templateInstance, () => {
				EmojiPicker.addRecent(emoji.replace(/:/g, ''));
			});
		}
	}
};

const emojiSort = (recents) => (a, b) => {
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
const exactFinalTone = new RegExp('^tone[1-5]:*$');
const colorBlind = new RegExp('tone[1-5]:*$');
const seeColor = new RegExp('_t(?:o|$)(?:n|$)(?:e|$)(?:[1-5]|$)(?:\:|$)$');
const getEmojis = function(collection, filter) {
	const key = `:${ filter }`;

	if (!getUserPreference(Meteor.userId(), 'useEmojis')) {
		return [];
	}

	if (!emoji.packages.emojione || emoji.packages.emojione.asciiList[key]) {
		return [];
	}

	const regExp = new RegExp(RegExp.escape(filter), 'i');
	const recents = EmojiPicker.getRecent().map((item) => `:${ item }:`);
	return Object.keys(collection).map((_id) => {
		const data = collection[key];
		return { _id, data };
	})
		.filter(({ _id }) => regExp.test(_id) && (exactFinalTone.test(_id.substring(key.length)) || seeColor.test(key) || !colorBlind.test(_id)))
		.sort(emojiSort(recents))
		.slice(0, 10);
};

Template.messagePopupConfig.helpers({
	popupUserConfig() {
		const self = this;
		const config = {
			title: t('People'),
			collection: usersFromRoomMessages,
			template: 'messagePopupUser',
			getInput: self.getInput,
			textFilterDelay: 500,
			trigger: '@',
			suffix: ' ',
			getFilter(collection, filter = '', cb) {
				const filterText = filter.trim();
				const filterRegex = new RegExp(`${ RegExp.escape(filterText) }`, 'i');

				// Get at least 5 users from messages sent on room
				const items = usersFromRoomMessages.find(
					{
						ts: { $exists: true },
						$or: [
							{ username: filterRegex },
							{ name: filterRegex },
						],
					},
					{
						limit: 5,
						sort: { ts: -1 },
					}
				)
					.fetch();

				// If needed, add to list the online users
				if (items.length < 5 && filterText !== '') {
					const usernamesAlreadyFetched = items.map(({ username }) => username);
					if (!hasAllPermission('view-outside-room')) {
						const usernamesFromDMs = Subscriptions
							.find(
								{
									t: 'd',
									$and: [
										{
											$or: [
												{ name: filterRegex },
												{ fname: filterRegex },
											],
										},
										{
											name: { $nin: usernamesAlreadyFetched },
										},
									],
								},
								{
									fields: { name: 1 },
								}
							)
							.map(({ name }) => name);
						const newItems = Users
							.find(
								{
									username: {
										$in: usernamesFromDMs,
									},
								},
								{
									fields: {
										username: 1,
										name: 1,
										status: 1,
									},
									limit: 5 - usernamesAlreadyFetched.length,
								}
							)
							.fetch()
							.map(({ username, name, status }) => ({
								_id: username,
								username,
								name,
								status,
								sort: 1,
							}));

						items.push(...newItems);
					} else {
						const user = Meteor.users.findOne(Meteor.userId(), { fields: { username: 1 } });
						const newItems = Meteor.users.find({
							$and: [
								{
									$or: [
										{ username: filterRegex },
										{ name: filterRegex },
									],
								},
								{
									username: {
										$nin: [
											user && user.username,
											...usernamesAlreadyFetched,
										],
									},
								},
							],
						},
						{
							fields: {
								username: 1,
								name: 1,
								status: 1,
							},
							limit: 5 - usernamesAlreadyFetched.length,
						})
							.fetch()
							.map(({ username, name, status }) => ({
								_id: username,
								username,
								name,
								status,
								sort: 1,
							}));

						items.push(...newItems);
					}
				}

				// Get users from Server
				if (items.length < 5 && filterText !== '') {
					fetchUsersFromServerDelayed(filterText, items, cb, RoomManager.openedRoom);
				}

				const all = {
					_id: 'all',
					username: 'all',
					system: true,
					name: t('Notify_all_in_this_room'),
					sort: 4,
				};

				const here = {
					_id: 'here',
					username: 'here',
					system: true,
					name: t('Notify_active_in_this_room'),
					sort: 4,
				};

				if (filterRegex.test(all.username)) {
					items.push(all);
				}

				if (filterRegex.test(here.username)) {
					items.push(here);
				}

				return items;
			},
			getValue(_id) {
				return _id;
			},
		};
		return config;
	},
	popupChannelConfig() {
		const self = this;
		const config = {
			title: t('Channels'),
			collection: Subscriptions,
			trigger: '#',
			suffix: ' ',
			textFilterDelay: 500,
			template: 'messagePopupChannel',
			getInput: self.getInput,
			getFilter(collection, filter, cb) {
				const exp = new RegExp(filter, 'i');
				const records = collection.find({
					name: exp,
					t: {
						$in: ['c', 'p'],
					},
				}, {
					reactive: 1,
					limit: 5,
					sort: {
						ls: -1,
					},
				}).fetch();

				if (records.length < 5 && filter && filter.trim() !== '') {
					fetchRoomsFromServerDelayed(filter, records, cb, RoomManager.openedRoom);
				}
				return records;
			},
			getValue(_id, collection, records) {
				const record = _.findWhere(records, {
					_id,
				});
				return record && record.name;
			},
		};
		return config;
	},
	popupPreviewConfig() {
		const self = this;
		const config = {
			title: t('Message_preview'),
			collection: Subscriptions,
			trigger: '`',
			suffix: ' ',
			textFilterDelay: 500,
			template: 'messagePopupPreview',
			getInput: self.getInput,
			getFilter(collection, filter, cb) {
				const exp = new RegExp(filter, 'i');
				const records = collection.find({
					name: exp,
					t: {
						$in: ['c', 'p'],
					},
				}, {
					reactive: 1,
					limit: 1,
					sort: {
						ls: -1,
					},
				}).fetch();

				if (records.length < 5 && filter && filter.trim() !== '') {
					fetchRoomsFromServerDelayed(filter, records, cb, RoomManager.openedRoom);
				}
				return records;
			},
			getValue(_id, collection, records) {
				const record = _.findWhere(records, {
					_id,
				});
				return record && record.name;
			},
		};
		return config;
	},
	popupSlashCommandsConfig() {
		const self = this;
		const config = {
			title: t('Commands'),
			collection: slashCommands.commands,
			trigger: '/',
			suffix: ' ',
			triggerAnywhere: false,
			template: 'messagePopupSlashCommand',
			getInput: self.getInput,
			getFilter(collection, filter) {
				return Object.keys(collection).map((command) => {
					const item = collection[command];
					return {
						_id: command,
						params: item.params ? TAPi18n.__(item.params) : '',
						description: TAPi18n.__(item.description),
						permission: item.permission,
					};
				}).filter((command) => {
					const isMatch = command._id.indexOf(filter) > -1;

					if (!isMatch) {
						return false;
					}

					if (!command.permission) {
						return true;
					}

					return hasAtLeastOnePermission(command.permission, Session.get('openedRoom'));
				}).sort((a, b) => a._id > b._id).slice(0, 11);
			},
		};
		return config;
	},
	emojiEnabled() {
		return emoji != null;
	},
	popupEmojiConfig() {
		if (emoji != null) {
			const self = this;
			return {
				title: t('Emoji'),
				collection: emoji.list,
				template: 'messagePopupEmoji',
				trigger: ':',
				prefix: '',
				suffix: ' ',
				getInput: self.getInput,
				getFilter: getEmojis,
				getValue(_id) {
					addEmojiToRecents(_id);
					return _id;
				},
			};
		}
	},
	popupReactionEmojiConfig() {
		if (emoji != null) {
			const self = this;
			return {
				title: t('Emoji'),
				collection: emoji.list,
				template: 'messagePopupEmoji',
				trigger: '\\+:',
				prefix: '+',
				suffix: ' ',
				getInput: self.getInput,
				getFilter: getEmojis,
				getValue(_id) {
					addEmojiToRecents(_id);
					return _id;
				},
			};
		}
	},
});
