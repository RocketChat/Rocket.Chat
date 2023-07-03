import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Filter, FindOptions } from 'mongodb';

class MessageSearchQueryParser {
	private query: Exclude<Filter<IMessage>, Partial<IMessage>> = {};

	private options: FindOptions<IMessage> = {
		projection: {},
		sort: {
			ts: -1,
		},
		skip: 0,
		limit: 20,
	};

	private user: IUser | undefined;

	private forceRegex = false;

	constructor({
		user,
		offset = 0,
		limit = 20,
		forceRegex = false,
	}: {
		user?: IUser;
		offset?: number;
		limit?: number;
		forceRegex?: boolean;
	}) {
		this.user = user;
		this.options.skip = offset;
		this.options.limit = limit;
		this.forceRegex = forceRegex;
	}

	private consumeFrom(text: string) {
		const from: string[] = [];

		return text.replace(/from:([a-z0-9.\-_]+)/gi, (_, username) => {
			if (username === 'me' && this.user?.username && !from.includes(this.user.username)) {
				username = this.user.username;
			}
			from.push(username);

			this.query['u.username'] = {
				$regex: from.join('|'),
				$options: 'i',
			};

			return '';
		});
	}

	private consumeMention(text: string) {
		const mentions: string[] = [];

		return text.replace(/mention:([a-z0-9.\-_]+)/gi, (_: string, username: string) => {
			mentions.push(username);

			this.query['mentions.username'] = {
				$regex: mentions.join('|'),
				$options: 'i',
			};

			return '';
		});
	}

	/**
	 * Filter on messages that are starred by the current user.
	 */
	private consumeHasStar(text: string) {
		return text.replace(/has:star/g, () => {
			if (this.user?._id) {
				this.query['starred._id'] = this.user._id;
			}
			return '';
		});
	}

	/**
	 * Filter on messages that have an url.
	 */
	private consumeHasUrl(text: string) {
		return text.replace(/has:url|has:link/g, () => {
			this.query['urls.0'] = {
				$exists: true,
			};
			return '';
		});
	}

	/**
	 * Filter on pinned messages.
	 */
	private consumeIsPinned(text: string) {
		return text.replace(/is:pinned|has:pin/g, () => {
			this.query.pinned = true;
			return '';
		});
	}

	/**
	 * Filter on messages which have a location attached.
	 */
	private consumeHasLocation(text: string) {
		return text.replace(/has:location|has:map/g, () => {
			this.query.location = {
				$exists: true,
			};
			return '';
		});
	}

	/**
	 * Filter image tags
	 */
	private consumeLabel(text: string) {
		return text.replace(/label:(\w+)/g, (_: string, tag: string) => {
			this.query['attachments.0.labels'] = {
				$regex: escapeRegExp(tag),
				$options: 'i',
			};
			return '';
		});
	}

	/**
	 * Filter on description of messages.
	 */
	private consumeFileDescription(text: string) {
		return text.replace(/file-desc:(\w+)/g, (_: string, tag: string) => {
			this.query['attachments.description'] = {
				$regex: escapeRegExp(tag),
				$options: 'i',
			};
			return '';
		});
	}

	/**
	 * Filter on title of messages.
	 */
	private consumeFileTitle(text: string) {
		return text.replace(/file-title:(\w+)/g, (_: string, tag: string) => {
			this.query['attachments.title'] = {
				$regex: escapeRegExp(tag),
				$options: 'i',
			};

			return '';
		});
	}

	/**
	 * Filter on messages that have been sent before a date.
	 */
	private consumeBefore(text: string) {
		return text.replace(/before:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, (_: string, day: string, month: string, year: string) => {
			const beforeDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
			beforeDate.setUTCHours(beforeDate.getUTCHours() + beforeDate.getTimezoneOffset() / 60 + (this.user?.utcOffset ?? 0));

			this.query.ts = {
				...this.query.ts,
				$lte: beforeDate,
			};

			return '';
		});
	}

	/**
	 * Filter on messages that have been sent after a date.
	 */
	private consumeAfter(text: string) {
		return text.replace(/after:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, (_: string, day: string, month: string, year: string) => {
			const afterDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) + 1);
			afterDate.setUTCHours(afterDate.getUTCHours() + afterDate.getTimezoneOffset() / 60 + (this.user?.utcOffset ?? 0));

			this.query.ts = {
				...this.query.ts,
				$gte: afterDate,
			};

			return '';
		});
	}

	/**
	 * Filter on messages that have been sent on a date.
	 */
	private consumeOn(text: string) {
		return text.replace(/on:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, (_: string, day: string, month: string, year: string) => {
			const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
			date.setUTCHours(date.getUTCHours() + date.getTimezoneOffset() / 60 + (this.user?.utcOffset ?? 0));
			const dayAfter = new Date(date);
			dayAfter.setDate(dayAfter.getDate() + 1);

			this.query.ts = {
				$gte: date,
				$lt: dayAfter,
			};

			return '';
		});
	}

	/**
	 * Sort by timestamp.
	 */
	consumeOrder(text: string) {
		return text.replace(/(?:order|sort):(asc|ascend|ascending|desc|descend|descending)/g, (_: string, direction: string) => {
			if (direction.startsWith('asc')) {
				this.options.sort = {
					...(typeof this.options.sort === 'object' && !Array.isArray(this.options.sort) ? this.options.sort : {}),
					ts: 1,
				};
			} else if (direction.startsWith('desc')) {
				this.options.sort = {
					...(typeof this.options.sort === 'object' && !Array.isArray(this.options.sort) ? this.options.sort : {}),
					ts: -1,
				};
			}
			return '';
		});
	}

	/**
	 * Query in message text
	 */
	private consumeMessageText(text: string) {
		text = text.trim().replace(/\s\s/g, ' ');

		if (text === '') {
			return text;
		}

		if (/^\/.+\/[imxs]*$/.test(text)) {
			const r = text.split('/');
			this.query.msg = {
				$regex: r[1],
				$options: r[2],
			};
		} else if (this.forceRegex) {
			this.query.msg = {
				$regex: text,
				$options: 'i',
			};
		} else {
			this.query.$text = {
				$search: text,
			};
			this.options.projection = {
				score: {
					$meta: 'textScore',
				},
			};
		}

		return text;
	}

	parse(text: string) {
		[
			(input: string) => this.consumeFrom(input),
			(input: string) => this.consumeMention(input),
			(input: string) => this.consumeHasStar(input),
			(input: string) => this.consumeHasUrl(input),
			(input: string) => this.consumeIsPinned(input),
			(input: string) => this.consumeHasLocation(input),
			(input: string) => this.consumeLabel(input),
			(input: string) => this.consumeFileDescription(input),
			(input: string) => this.consumeFileTitle(input),
			(input: string) => this.consumeBefore(input),
			(input: string) => this.consumeAfter(input),
			(input: string) => this.consumeOn(input),
			(input: string) => this.consumeOrder(input),
			(input: string) => this.consumeMessageText(input),
		].reduce((text, fn) => fn(text), text);

		return {
			query: this.query,
			options: this.options,
		};
	}
}

/**
 * Parses a message search query and returns a MongoDB query and options
 * @param text The query text
 * @param options The options
 * @param options.user The user object
 * @param options.offset The offset
 * @param options.limit The limit
 * @param options.forceRegex Whether to force the use of regex
 * @returns The MongoDB query and options
 * @private
 * @example
 * const { query, options } = parseMessageSearchQuery('from:rocket.cat', {
 * 	user: await Meteor.userAsync(),
 * 	offset: 0,
 * 	limit: 20,
 * 	forceRegex: false,
 * });
 */
export function parseMessageSearchQuery(
	text: string,
	{
		user,
		offset = 0,
		limit = 20,
		forceRegex = false,
	}: {
		user?: IUser;
		offset?: number;
		limit?: number;
		forceRegex?: boolean;
	},
) {
	const parser = new MessageSearchQueryParser({ user, offset, limit, forceRegex });
	return parser.parse(text);
}
