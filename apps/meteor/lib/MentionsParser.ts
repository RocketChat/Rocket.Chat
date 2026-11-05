import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/tools';

export type MentionsParserArgs = {
	pattern: () => string;
	useRealName?: () => boolean;
	me?: () => string;
	roomTemplate?: (args: { prefix: string; reference: string; mention: string; channel?: any }) => string;
	userTemplate?: (args: { prefix: string; className: string; mention: string; title?: string; label: string; type?: string }) => string;
};

const userTemplateDefault = ({
	prefix,
	className,
	mention,
	title = '',
	label,
	type = 'username',
}: {
	prefix: string;
	className: string;
	mention: string;
	title?: string;
	label?: string;
	type?: string;
}) => `${prefix}<a class="${className}" data-${type}="${mention}"${title ? ` title="${title}"` : ''}>${label}</a>`;

const roomTemplateDefault = ({ prefix, reference, mention }: { prefix: string; reference: string; mention: string }) =>
	`${prefix}<a class="mention-link mention-link--room" data-channel="${reference}">${`#${mention}`}</a>`;

export class MentionsParser {
	me: () => string;

	pattern: MentionsParserArgs['pattern'];

	userTemplate: (args: { prefix: string; className: string; mention: string; title?: string; label: string; type?: string }) => string;

	roomTemplate: (args: { prefix: string; reference: string; mention: string; channel?: any }) => string;

	useRealName: () => boolean;

	constructor({ pattern, useRealName, me, roomTemplate = roomTemplateDefault, userTemplate = userTemplateDefault }: MentionsParserArgs) {
		this.pattern = pattern;
		this.useRealName = useRealName || (() => false);
		this.me = me || (() => '');
		this.userTemplate = userTemplate;
		this.roomTemplate = roomTemplate;
	}

	// The mention regexes only depend on the configured pattern (a setting that
	// rarely changes), but these getters are hit multiple times per message;
	// cache the compiled regexes and rebuild only when the pattern changes.
	// Sharing the instances is safe because they're only used with
	// String.prototype.replace/match, which reset lastIndex on each call.
	private cachedPattern: string | undefined;

	private cachedUserMentionRegex: RegExp | undefined;

	private cachedChannelMentionRegex: RegExp | undefined;

	private updateRegexCache() {
		const pattern = this.pattern();
		if (pattern !== this.cachedPattern || !this.cachedUserMentionRegex || !this.cachedChannelMentionRegex) {
			this.cachedPattern = pattern;
			this.cachedUserMentionRegex = new RegExp(`(^|\\s|>)@(${pattern}(@(${pattern}))?(:([0-9a-zA-Z-_.]+))?)`, 'gm');
			this.cachedChannelMentionRegex = new RegExp(`(^|\\s|>)#(${pattern}(@(${pattern}))?)`, 'gm');
		}
	}

	get userMentionRegex(): RegExp {
		this.updateRegexCache();
		return this.cachedUserMentionRegex as RegExp;
	}

	get channelMentionRegex(): RegExp {
		this.updateRegexCache();
		return this.cachedChannelMentionRegex as RegExp;
	}

	replaceUsers = (msg: string, { mentions, temp }: IMessage, me: string) =>
		msg.replace(this.userMentionRegex, (match, prefix, mention) => {
			const classNames = ['mention-link'];

			if (mention === 'all') {
				classNames.push('mention-link--all');
				classNames.push('mention-link--group');
			} else if (mention === 'here') {
				classNames.push('mention-link--here');
				classNames.push('mention-link--group');
			} else if (mention === me) {
				classNames.push('mention-link--me');
				classNames.push('mention-link--user');
			} else {
				classNames.push('mention-link--user');
			}

			const className = classNames.join(' ');

			if (mention === 'all' || mention === 'here') {
				return this.userTemplate({ prefix, className, mention, label: mention, type: 'group' });
			}

			const filterUser = ({ username, type }: { username?: string; type?: string }) => (!type || type === 'user') && username === mention;
			const filterTeam = ({ name, type }: { name?: string; type?: string }) => type === 'team' && name === mention;

			const [mentionObj] = (mentions || []).filter((m) => m && (filterUser(m) || filterTeam(m)));

			const label = temp
				? mention && escapeHTML(mention)
				: mentionObj && escapeHTML((mentionObj.type === 'team' || this.useRealName() ? mentionObj.name : mentionObj.username) || '');

			if (!label) {
				return match;
			}

			return this.userTemplate({
				prefix,
				className,
				mention,
				label,
				type: mentionObj?.type === 'team' ? 'team' : 'username',
				title: this.useRealName() ? mention : label,
			});
		});

	replaceChannels = (msg: string, { temp, channels }: IMessage) =>
		msg.replace(/&#39;/g, "'").replace(this.channelMentionRegex, (match, prefix, mention) => {
			const channel = channels?.find(({ name }) => {
				return name === mention;
			});

			if (!temp && !channel) {
				return match;
			}

			const reference = channel ? channel._id : mention;
			return this.roomTemplate({ prefix, reference, channel, mention });
		});

	getUserMentions(msg: string) {
		// First remove the text inside md links
		const str = msg.replace(/\[[^\]]*\]\([^)]+\)/g, '');
		// Then do the match
		return (str.match(this.userMentionRegex) || []).map((match) => match.trim());
	}

	getChannelMentions(msg: string) {
		// First remove the text inside md links
		const str = msg.replace(/\[[^\]]*\]\([^)]+\)/g, '');
		// Then do the match
		return (str.match(this.channelMentionRegex) || []).map((match) => match.trim());
	}

	parse(message: IMessage) {
		let msg = message?.html || '';
		if (!msg.trim()) {
			return message;
		}
		msg = this.replaceUsers(msg, message, this.me());
		msg = this.replaceChannels(msg, message);
		message.html = msg;
		return message;
	}
}
