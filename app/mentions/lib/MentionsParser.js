import s from 'underscore.string';

export class MentionsParser {
	constructor({ pattern, useRealName, me }) {
		this.pattern = pattern;
		this.useRealName = useRealName;
		this.me = me;
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
		return new RegExp(`(^|\\s|<p>|<br> ?)@(${ this.pattern }(@(${ this.pattern }))?)`, 'gm');
	}

	get channelMentionRegex() {
		return new RegExp(`(^|\\s|<p>)#(${ this.pattern }(@(${ this.pattern }))?)`, 'gm');
	}

	replaceUsers = (msg, { mentions, temp }, me) => msg
		.replace(this.userMentionRegex, (match, prefix, mention) => {
			const isGroupMention = ['all', 'here'].includes(mention);
			const className = [
				'mention-link',
				'mention-link--user',
				mention === 'all' && 'mention-link--all',
				mention === 'here' && 'mention-link--here',
				mention === me && 'mention-link--me',
				isGroupMention && 'mention-link--group',
			].filter(Boolean).join(' ');

			if (isGroupMention) {
				return `${ prefix }<a class="${ className }">${ mention }</a>`;
			}

			const label = temp ?
				mention && s.escapeHTML(mention) :
				(mentions || [])
					.filter(({ username }) => username === mention)
					.map(({ name, username }) => (this.useRealName ? name : username))
					.map((label) => label && s.escapeHTML(label))[0];

			if (!label) {
				return match;
			}

			return `${ prefix }<a class="${ className }" data-username="${ mention }" title="${ this.useRealName ? mention : label }">${ label }</a>`;
		})

	replaceChannels = (msg, { temp, channels }) => msg
		.replace(/&#39;/g, '\'')
		.replace(this.channelMentionRegex, (match, prefix, mention) => {
			if (!temp && !(channels && channels.find((c) => c.name === mention))) {
				return match;
			}

			const channel = channels && channels.find(({ name }) => name === mention);
			const reference = channel ? channel._id : mention;
			return `${ prefix }<a class="mention-link mention-link--room" data-channel="${ reference }">${ `#${ mention }` }</a>`;
		})

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
