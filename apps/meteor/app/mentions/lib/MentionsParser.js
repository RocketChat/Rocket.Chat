import { escapeHTML } from '@rocket.chat/string-helpers';

const userTemplateDefault = ({ prefix, className, mention, title, label, type = 'username' }) =>
	`${prefix}<a class="${className}" data-${type}="${mention}"${title ? ` title="${title}"` : ''}>${label}</a>`;
const roomTemplateDefault = ({ prefix, reference, mention }) =>
	`${prefix}<a class="mention-link mention-link--room" data-channel="${reference}">${`#${mention}`}</a>`;
export class MentionsParser {
	constructor({ pattern, useRealName, me, roomTemplate = roomTemplateDefault, userTemplate = userTemplateDefault }) {
		this.pattern = pattern;
		this.useRealName = useRealName;
		this.me = me;
		this.userTemplate = userTemplate;
		this.roomTemplate = roomTemplate;
	}

	set me(m) {
		this._me = m;
	}

	get me() {
		return typeof this._me === 'function' ? this._me() : this._me;
	}

	set pattern(p) {
		this._pattern = p;
	}

	get pattern() {
		return typeof this._pattern === 'function' ? this._pattern() : this._pattern;
	}

	set useRealName(s) {
		this._useRealName = s;
	}

	get useRealName() {
		return typeof this._useRealName === 'function' ? this._useRealName() : this._useRealName;
	}

	get userMentionRegex() {
		return new RegExp(`(^|\\s|> ?)@(${this.pattern}(@(${this.pattern}))?)`, 'gm');
	}

	get channelMentionRegex() {
		return new RegExp(`(^|\\s|>)#(${this.pattern}(@(${this.pattern}))?)`, 'gm');
	}

	replaceUsers = (msg, { mentions, temp }, me) =>
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

			const filterUser = ({ username, type }) => (!type || type === 'user') && username === mention;
			const filterTeam = ({ name, type }) => type === 'team' && name === mention;

			const [mentionObj] = (mentions || []).filter((m) => filterUser(m) || filterTeam(m));

			const label = temp
				? mention && escapeHTML(mention)
				: mentionObj && escapeHTML(mentionObj.type === 'team' || this.useRealName ? mentionObj.name : mentionObj.username);

			if (!label) {
				return match;
			}

			return this.userTemplate({
				prefix,
				className,
				mention,
				label,
				type: mentionObj?.type === 'team' ? 'team' : 'username',
				title: this.useRealName ? mention : label,
			});
		});

	replaceChannels = (msg, { temp, channels }) =>
		msg.replace(/&#39;/g, "'").replace(this.channelMentionRegex, (match, prefix, mention) => {
			if (
				!temp &&
				!(
					channels &&
					channels.find(function (c) {
						return c.dname ? c.dname === mention : c.name === mention;
					})
				)
			) {
				return match;
			}

			const channel =
				channels &&
				channels.find(function ({ name, dname }) {
					return dname ? dname === mention : name === mention;
				});
			const reference = channel ? channel._id : mention;
			return this.roomTemplate({ prefix, reference, channel, mention });
		});

	getUserMentions(str) {
		return (str.match(this.userMentionRegex) || []).map((match) => match.trim());
	}

	getChannelMentions(str) {
		return (str.match(this.channelMentionRegex) || []).map((match) => match.trim());
	}

	parse(message) {
		let msg = (message && message.html) || '';
		if (!msg.trim()) {
			return message;
		}
		msg = this.replaceUsers(msg, message, this.me);
		msg = this.replaceChannels(msg, message, this.me);
		message.html = msg;
		return message;
	}
}
