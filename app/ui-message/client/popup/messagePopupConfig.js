import _ from 'underscore';
import { Blaze } from 'meteor/blaze';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { Messages, Subscriptions } from '../../../models/client';
import { settings } from '../../../settings/client';
import { hasAllPermission, hasAtLeastOnePermission } from '../../../authorization/client';
import { EmojiPicker, emoji } from '../../../emoji';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { t, getUserPreference, slashCommands } from '../../../utils/client';
import { customMessagePopups } from './customMessagePopups';
import './messagePopupConfig.html';
import './messagePopupSlashCommand.html';
import './messagePopupUser.html';

const reloadUsersFromRoomMessages = (rid, template) => {
	const user = Meteor.userId() && Meteor.users.findOne(Meteor.userId(), { fields: { username: 1 } });
	if (!rid || !user) {
		return;
	}

	template.usersFromRoomMessages.remove({});

	const uniqueMessageUsersControl = {};

	Messages.find(
		{
			rid,
			'u.username': { $ne: user.username },
			't': { $exists: false },
		},
		{
			fields: {
				'u.username': 1,
				'u.name': 1,
				'ts': 1,
			},
			sort: { ts: -1 },
		},
	)
		.fetch()
		.filter(({ u: { username } }) => {
			const notMapped = !uniqueMessageUsersControl[username];
			uniqueMessageUsersControl[username] = true;
			return notMapped;
		})
		.forEach(({ u: { username, name }, ts }) =>
			template.usersFromRoomMessages.upsert(username, {
				_id: username,
				username,
				name,
				status: Tracker.nonreactive(() => Session.get(`user_${username}_status`) || 'offline'),
				ts,
			}),
		);
};

const fetchUsersFromServer = _.throttle(async (filterText, records, rid, cb) => {
	const usernames = records.map(({ username }) => username);

	const { users } = await callWithErrorHandling('spotlight', filterText, usernames, { users: true, mentions: true }, rid);

	if (!users || users.length <= 0) {
		return;
	}

	users
		// .slice(0, 5)
		.forEach(({ username, nickname, name, status, avatarETag, outside }) => {
			// if (records.length < 5) {
			records.push({
				_id: username,
				username,
				nickname,
				name,
				status,
				avatarETag,
				outside,
				sort: 3,
			});
			// }
		});

	records.sort(({ sort: sortA }, { sort: sortB }) => sortA - sortB);

	cb && cb(records);
}, 1000);

const fetchRoomsFromServer = _.throttle(async (filterText, records, rid, cb) => {
	if (!hasAllPermission('view-outside-room')) {
		cb && cb([]);
		return;
	}

	const { rooms } = await callWithErrorHandling('spotlight', filterText, null, { rooms: true, mentions: true }, rid);

	if (!rooms || rooms.length <= 0) {
		return;
	}

	rooms.slice(0, 5).forEach((room) => {
		if (records.length < 5) {
			records.push(room);
		}
	});

	cb && cb(records);
}, 1000);

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
const seeColor = new RegExp('_t(?:o|$)(?:n|$)(?:e|$)(?:[1-5]|$)(?::|$)$');
const getEmojis = (collection, filter) => {
	const key = `:${filter}`;

	if (!getUserPreference(Meteor.userId(), 'useEmojis')) {
		return [];
	}

	if (!emoji.packages.emojione || emoji.packages.emojione.asciiList[key]) {
		return [];
	}

	const regExp = new RegExp(escapeRegExp(filter), 'i');
	const recents = EmojiPicker.getRecent().map((item) => `:${item}:`);

	return Object.keys(collection)
		.map((_id) => {
			const data = collection[key];
			return { _id, data };
		})
		.filter(
			({ _id }) => regExp.test(_id) && (exactFinalTone.test(_id.substring(key.length)) || seeColor.test(key) || !colorBlind.test(_id)),
		)
		.sort(emojiSort(recents))
		.slice(0, 10);
};

const addEmojiToRecents = (emoji) => {
	const pickerEl = document.querySelector('.emoji-picker');
	if (!pickerEl) {
		return;
	}

	const view = Blaze.getView(pickerEl);
	if (!view) {
		return;
	}

	Template._withTemplateInstanceFunc(view.templateInstance, () => {
		EmojiPicker.addRecent(emoji.replace(/:/g, ''));
	});
};

Template.messagePopupConfig.onCreated(function () {
	this.usersFromRoomMessages = new Mongo.Collection(null);

	this.autorun(() => {
		const { rid } = this.data;
		reloadUsersFromRoomMessages(rid, this);
	});
});

Template.messagePopupConfig.helpers({
	customMessagePopups() {
		return customMessagePopups.get();
	},

	getCustomConfig() {
		const template = Template.instance();
		return this.configGetter(template);
	},

	popupUserConfig() {
		const template = Template.instance();
		const suggestionsCount = settings.get('Number_of_users_autocomplete_suggestions');

		return {
			title: t('People'),
			collection: template.usersFromRoomMessages,
			template: 'messagePopupUser',
			rid: this.rid,
			getInput: this.getInput,
			textFilterDelay: 500,
			trigger: '@',
			suffix: ' ',
			getFilter: (collection, filter = '', cb) => {
				const { rid } = this;
				const filterText = filter.trim();
				const filterRegex = filterText !== '' && new RegExp(`${escapeRegExp(filterText)}`, 'i');

				const items = template.usersFromRoomMessages
					.find(
						{
							ts: { $exists: true },
							...(filterText && {
								$or: [{ username: filterRegex }, { name: filterRegex }],
							}),
						},
						{
							limit: filterText ? 2 : suggestionsCount,
							sort: { ts: -1 },
						},
					)
					.fetch()
					.map((u) => {
						u.suggestion = true;
						return u;
					});

				// // If needed, add to list the online users
				// if (items.length < 5 && filterRegex) {
				// 	const usernamesAlreadyFetched = items.map(({ username }) => username);
				// 	if (!hasAllPermission('view-outside-room')) {
				// 		const usernamesFromDMs = Subscriptions
				// 			.find(
				// 				{
				// 					t: 'd',
				// 					$and: [
				// 						{
				// 							...filterRegex && {
				// 								$or: [
				// 									{ name: filterRegex },
				// 									{ fname: filterRegex },
				// 								],
				// 							},
				// 						},
				// 						{
				// 							name: { $nin: usernamesAlreadyFetched },
				// 						},
				// 					],
				// 				},
				// 				{
				// 					fields: { name: 1 },
				// 				},
				// 			)
				// 			.map(({ name }) => name);
				// 		const newItems = Users
				// 			.find(
				// 				{
				// 					username: {
				// 						$in: usernamesFromDMs,
				// 					},
				// 				},
				// 				{
				// 					fields: {
				// 						username: 1,
				// 						nickname: 1,
				// 						name: 1,
				// 						status: 1,
				// 					},
				// 					limit: 5 - usernamesAlreadyFetched.length,
				// 				},
				// 			)
				// 			.fetch()
				// 			.map(({ username, name, status, nickname }) => ({
				// 				_id: username,
				// 				username,
				// 				nickname,
				// 				name,
				// 				status,
				// 				sort: 1,
				// 			}));

				// 		items.push(...newItems);
				// 	} else {
				// 		const user = Meteor.users.findOne(Meteor.userId(), { fields: { username: 1 } });
				// 		const newItems = Meteor.users.find({
				// 			$and: [
				// 				{
				// 					...filterRegex && {
				// 						$or: [
				// 							{ username: filterRegex },
				// 							{ name: filterRegex },
				// 						],
				// 					},
				// 				},
				// 				{
				// 					username: {
				// 						$nin: [
				// 							user && user.username,
				// 							...usernamesAlreadyFetched,
				// 						],
				// 					},
				// 				},
				// 			],
				// 		},
				// 		{
				// 			fields: {
				// 				username: 1,
				// 				nickname: 1,
				// 				name: 1,
				// 				status: 1,
				// 			},
				// 			limit: 5 - usernamesAlreadyFetched.length,
				// 		})
				// 			.fetch()
				// 			.map(({ username, name, status, nickname }) => ({
				// 				_id: username,
				// 				username,
				// 				nickname,
				// 				name,
				// 				status,
				// 				sort: 1,
				// 			}));

				// 		items.push(...newItems);
				// 	}
				// }

				// Get users from Server
				if (items.length < suggestionsCount && filterText !== '') {
					fetchUsersFromServer(filterText, items, rid, cb);
				}

				if (!filterRegex || filterRegex.test('all')) {
					items.push({
						_id: 'all',
						username: 'all',
						system: true,
						name: t('Notify_all_in_this_room'),
						sort: 4,
					});
				}

				if (!filterRegex || filterRegex.test('here')) {
					items.push({
						_id: 'here',
						username: 'here',
						system: true,
						name: t('Notify_active_in_this_room'),
						sort: 4,
					});
				}

				return items;
			},
			getValue: (_id) => _id,
		};
	},
	popupChannelConfig() {
		return {
			title: t('Channels'),
			collection: Subscriptions,
			trigger: '#',
			suffix: ' ',
			textFilterDelay: 500,
			template: 'messagePopupChannel',
			rid: this.rid,
			getInput: this.getInput,
			getFilter: (collection, filter, cb) => {
				const { rid } = this;
				const exp = new RegExp(filter, 'i');
				const records = collection
					.find(
						{
							name: exp,
							t: {
								$in: ['c', 'p'],
							},
						},
						{
							reactive: 1,
							limit: 5,
							sort: {
								ls: -1,
							},
						},
					)
					.fetch();

				if (records.length < 5 && filter && filter.trim() !== '') {
					fetchRoomsFromServer(filter, records, rid, cb);
				}
				return records;
			},
			getValue: (_id, collection, records) => {
				const record = _.findWhere(records, {
					_id,
				});
				return record && record.name;
			},
		};
	},
	popupSlashCommandsConfig() {
		return {
			title: t('Commands'),
			collection: slashCommands.commands,
			trigger: '/',
			suffix: ' ',
			triggerAnywhere: false,
			template: 'messagePopupSlashCommand',
			rid: this.rid,
			getInput: this.getInput,
			getFilter: (collection, filter) => {
				const { rid } = this;
				return Object.keys(collection)
					.map((command) => {
						const item = collection[command];
						return {
							_id: command,
							params: item.params ? TAPi18n.__(item.params) : '',
							description: TAPi18n.__(item.description),
							permission: item.permission,
						};
					})
					.filter((command) => {
						const isMatch = command._id.indexOf(filter) > -1;

						if (!isMatch) {
							return false;
						}

						if (!command.permission) {
							return true;
						}

						return hasAtLeastOnePermission(command.permission, rid);
					})
					.sort((a, b) => a._id > b._id)
					.slice(0, 11);
			},
		};
	},
	popupEmojiConfig() {
		return {
			title: t('Emoji'),
			collection: emoji.list,
			template: 'messagePopupEmoji',
			trigger: ':',
			prefix: '',
			suffix: ' ',
			rid: this.rid,
			getInput: this.getInput,
			getFilter: getEmojis,
			getValue: (emojiText) => {
				addEmojiToRecents(emojiText);
				return emojiText;
			},
		};
	},
	popupReactionEmojiConfig() {
		return {
			title: t('Emoji'),
			collection: emoji.list,
			template: 'messagePopupEmoji',
			trigger: '\\+:',
			prefix: '+',
			suffix: ' ',
			rid: this.rid,
			getInput: this.getInput,
			getFilter: getEmojis,
			getValue: (emojiText) => {
				addEmojiToRecents(emojiText);
				return emojiText;
			},
		};
	},
});
