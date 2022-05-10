import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { canAccessRoomId } from '../../app/authorization/server';
import { Subscriptions } from '../../app/models/server';
import { Messages } from '../../app/models/server/raw';
import { settings } from '../../app/settings/server';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';

Meteor.methods({
	messageSearch(text, rid, limit, offset) {
		check(text, String);
		check(rid, Match.Maybe(String));
		check(limit, Match.Optional(Number));
		check(offset, Match.Optional(Number));

		// TODO: Evaluate why we are returning `users` and `channels`, as the only thing that gets set is the `messages`.
		const result = {
			message: {
				docs: [],
			},
		};

		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messageSearch',
			});
		}

		// Don't process anything else if the user can't access the room
		if (rid) {
			if (!canAccessRoomId(rid, currentUserId)) {
				return false;
			}
		} else if (settings.get('Search.defaultProvider.GlobalSearchEnabled') !== true) {
			return result;
		}

		const user = Meteor.user();
		const currentUserName = user.username;
		const currentUserTimezoneOffset = user.utcOffset;

		const query = {};
		const options = {
			projection: {},
			sort: {
				ts: -1,
			},
			skip: offset || 0,
			limit: limit || 20,
		};

		// I would place these methods at the bottom of the file for clarity but travis doesn't appreciate that.
		// (no-use-before-define)

		function filterStarred() {
			query['starred._id'] = currentUserId;
			return '';
		}

		function filterUrl() {
			query['urls.0'] = {
				$exists: true,
			};
			return '';
		}

		function filterPinned() {
			query.pinned = true;
			return '';
		}

		function filterLocation() {
			query.location = {
				$exist: true,
			};
			return '';
		}

		function filterBeforeDate(_, day, month, year) {
			month--;
			const beforeDate = new Date(year, month, day);
			beforeDate.setHours(beforeDate.getUTCHours() + beforeDate.getTimezoneOffset() / 60 + currentUserTimezoneOffset);
			query.ts = {
				$lte: beforeDate,
			};
			return '';
		}

		function filterAfterDate(_, day, month, year) {
			month--;
			day++;
			const afterDate = new Date(year, month, day);
			afterDate.setUTCHours(afterDate.getUTCHours() + afterDate.getTimezoneOffset() / 60 + currentUserTimezoneOffset);
			if (query.ts) {
				query.ts.$gte = afterDate;
			} else {
				query.ts = {
					$gte: afterDate,
				};
			}
			return '';
		}

		function filterOnDate(_, day, month, year) {
			month--;
			const date = new Date(year, month, day);
			date.setUTCHours(date.getUTCHours() + date.getTimezoneOffset() / 60 + currentUserTimezoneOffset);
			const dayAfter = new Date(date);
			dayAfter.setDate(dayAfter.getDate() + 1);
			delete query.ts;
			query.ts = {
				$gte: date,
				$lt: dayAfter,
			};
			return '';
		}

		function filterLabel(_, tag) {
			query['attachments.0.labels'] = new RegExp(escapeRegExp(tag), 'i');
			return '';
		}

		function filterTitle(_, tag) {
			query['attachments.title'] = new RegExp(escapeRegExp(tag), 'i');
			return '';
		}

		function filterDescription(_, tag) {
			query['attachments.description'] = new RegExp(escapeRegExp(tag), 'i');
			return '';
		}

		function sortByTimestamp(_, direction) {
			if (direction.startsWith('asc')) {
				options.sort.ts = 1;
			} else if (direction.startsWith('desc')) {
				options.sort.ts = -1;
			}
			return '';
		}

		/*
		 text = 'from:rodrigo mention:gabriel chat'
		 */

		// Query for senders
		const from = [];
		text = text.replace(/from:([a-z0-9.-_]+)/gi, function (match, username) {
			if (username === 'me' && !from.includes(currentUserName)) {
				username = currentUserName;
			}
			from.push(username);
			return '';
		});

		if (from.length > 0) {
			query['u.username'] = {
				$regex: from.join('|'),
				$options: 'i',
			};
		}

		// Query for senders
		const mention = [];
		text = text.replace(/mention:([a-z0-9.-_]+)/gi, function (match, username) {
			mention.push(username);
			return '';
		});

		if (mention.length > 0) {
			query['mentions.username'] = {
				$regex: mention.join('|'),
				$options: 'i',
			};
		}

		// Filter on messages that are starred by the current user.
		text = text.replace(/has:star/g, filterStarred);
		// Filter on messages that have an url.
		text = text.replace(/has:url|has:link/g, filterUrl);
		// Filter on pinned messages.
		text = text.replace(/is:pinned|has:pin/g, filterPinned);
		// Filter on messages which have a location attached.
		text = text.replace(/has:location|has:map/g, filterLocation);
		// Filter image tags
		text = text.replace(/label:(\w+)/g, filterLabel);
		// Filter on description of messages.
		text = text.replace(/file-desc:(\w+)/g, filterDescription);
		// Filter on title of messages.
		text = text.replace(/file-title:(\w+)/g, filterTitle);
		// Filtering before/after/on a date
		// matches dd-MM-yyyy, dd/MM/yyyy, dd-MM-yyyy, prefixed by before:, after: and on: respectively.
		// Example: before:15/09/2016 after: 10-08-2016
		// if "on:" is set, "before:" and "after:" are ignored.
		text = text.replace(/before:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, filterBeforeDate);
		text = text.replace(/after:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, filterAfterDate);
		text = text.replace(/on:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, filterOnDate);
		// Sort order
		text = text.replace(/(?:order|sort):(asc|ascend|ascending|desc|descend|descending)/g, sortByTimestamp);

		// Query in message text
		text = text.trim().replace(/\s\s/g, ' ');
		if (text !== '') {
			if (/^\/.+\/[imxs]*$/.test(text)) {
				const r = text.split('/');
				query.msg = {
					$regex: r[1],
					$options: r[2],
				};
			} else if (settings.get('Message_AlwaysSearchRegExp')) {
				query.msg = {
					$regex: text,
					$options: 'i',
				};
			} else {
				query.$text = {
					$search: text,
				};
				options.projection = {
					score: {
						$meta: 'textScore',
					},
				};
			}
		}

		if (Object.keys(query).length > 0) {
			query.t = {
				$ne: 'rm', // hide removed messages (useful when searching for user messages)
			};
			query._hidden = {
				$ne: true, // don't return _hidden messages
			};

			if (rid) {
				query.rid = rid;
			} else {
				query.rid = {
					$in: Subscriptions.findByUserId(user._id)
						.fetch()
						.map((subscription) => subscription.rid),
				};
			}

			if (!settings.get('Message_ShowEditedStatus')) {
				options.projection = {
					editedAt: 0,
				};
			}

			result.message.docs = Promise.await(
				Messages.find(query, {
					readPreference: readSecondaryPreferred(Messages.col.s.db),
					...options,
				}).toArray(),
			);
		}

		return result;
	},
});
