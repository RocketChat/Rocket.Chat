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

			const safeUsernames = from.map((u) => `^${escapeRegExp(u)}$`);

			this.query['u.username'] = {
				$regex: safeUsernames.join('|'),
				$options: 'i',
			};

			return '';
		});
	}

	// ✅ FIXED
	private consumeMention(text: string) {
		const mentions: string[] = [];

		return text.replace(/mention:([a-z0-9.\-_]+)/gi, (_: string, username: string) => {
			mentions.push(username);

			const safeMentions = mentions.map((u) => `^${escapeRegExp(u)}$`);

			this.query['mentions.username'] = {
				$regex: safeMentions.join('|'),
				$options: 'i',
			};

			return '';
		});
	}

	private consumeHasStar(text: string) {
		return text.replace(/has:star/g, () => {
			if (this.user?._id) {
				this.query['starred._id'] = this.user._id;
			}
			return '';
		});
	}

	private consumeHasUrl(text: string) {
		return text.replace(/has:url|has:link/g, () => {
			this.query['urls.0'] = { $exists: true };
			return '';
		});
	}

	private consumeIsPinned(text: string) {
		return text.replace(/is:pinned|has:pin/g, () => {
			this.query.pinned = true;
			return '';
		});
	}

	private consumeHasLocation(text: string) {
		return text.replace(/has:location|has:map/g, () => {
			this.query.location = { $exists: true };
			return '';
		});
	}

	private consumeLabel(text: string) {
		return text.replace(/label:*"([^"]+)"|label:"?([^\s"]+[^"]?)"?/gu, (_match, quoted, unquoted) => {
			const tag = (quoted ?? unquoted)?.trim();
			if (!tag) return '';

			this.query['attachments.0.labels'] = {
				$regex: escapeRegExp(tag),
				$options: 'i',
			};

			return '';
		});
	}

	private consumeFileDescription(text: string) {
		return text.replace(/file-desc:"([^"]+)"|file-desc:"?([^\s"]+[^"]?)"?/gu, (_match, quoted, unquoted) => {
			const tag = (quoted ?? unquoted)?.trim();
			if (!tag) return '';

			this.query['attachments.description'] = {
				$regex: escapeRegExp(tag),
				$options: 'i',
			};

			return '';
		});
	}

	private consumeFileTitle(text: string) {
		return text.replace(/file-title:"([^"]+)"|file-title:"?([^\s"]+[^"]?)"?/gu, (_match, quoted, unquoted) => {
			const tag = (quoted ?? unquoted)?.trim();
			if (!tag) return '';

			this.query['attachments.title'] = {
				$regex: escapeRegExp(tag),
				$options: 'i',
			};

			return '';
		});
	}

	private consumeBefore(text: string) {
		return text.replace(/before:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, (_: string, day: string, month: string, year: string) => {
			const beforeDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));

			beforeDate.setUTCHours(
				beforeDate.getUTCHours() + beforeDate.getTimezoneOffset() / 60 + (this.user?.utcOffset ?? 0),
			);

			this.query.ts = {
				...this.query.ts,
				$lte: beforeDate,
			};

			return '';
		});
	}

	// ✅ FIXED BUG HERE
	private consumeAfter(text: string) {
		return text.replace(/after:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, (_: string, day: string, month: string, year: string) => {
			const afterDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) + 1);

			afterDate.setUTCHours(
				afterDate.getUTCHours() + afterDate.getTimezoneOffset() / 60 + (this.user?.utcOffset ?? 0),
			);

			this.query.ts = {
				...this.query.ts,
				$gte: afterDate,
			};

			return '';
		});
	}

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

	consumeOrder(text: string) {
		return text.replace(/(?:order|sort):(asc|desc)/g, (_: string, direction: string) => {
			this.options.sort = { ts: direction === 'asc' ? 1 : -1 };
			return '';
		});
	}

	private consumeMessageText(text: string) {
		text = text.trim();
		if (!text) return text;

		this.query.$text = { $search: text };
		this.options.projection = { score: { $meta: 'textScore' } };

		return text;
	}

	parse(text: string) {
		[
			(input) => this.consumeFrom(input),
			(input) => this.consumeMention(input),
			(input) => this.consumeHasStar(input),
			(input) => this.consumeHasUrl(input),
			(input) => this.consumeIsPinned(input),
			(input) => this.consumeHasLocation(input),
			(input) => this.consumeLabel(input),
			(input) => this.consumeFileDescription(input),
			(input) => this.consumeFileTitle(input),
			(input) => this.consumeBefore(input),
			(input) => this.consumeAfter(input),
			(input) => this.consumeOn(input),
			(input) => this.consumeOrder(input),
			(input) => this.consumeMessageText(input),
		].reduce((text, fn) => fn(text), text);

		return {
			query: this.query,
			options: this.options,
		};
	}
}

export function parseMessageSearchQuery(text: string, options: any) {
	const parser = new MessageSearchQueryParser(options);
	return parser.parse(text);
}
