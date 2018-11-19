/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/
import s from 'underscore.string';
export default class {
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
	replaceUsers(str, message, me) {
		return str.replace(this.userMentionRegex, (match, prefix, username) => {
			if (['all', 'here'].includes(username)) {
				return `${ prefix }<a class="mention-link mention-link-me mention-link-all">@${ username }</a>`;
			}

			const mentionObj = message.mentions && message.mentions.find((m) => m.username === username);

			if (message.temp == null && mentionObj == null) {
				return match;
			}

			const name = this.useRealName && mentionObj && s.escapeHTML(mentionObj.name);

			return `${ prefix }<a class="mention-link ${ username === me ? 'mention-link-me' : '' }" data-username="${ username }" title="${ name ? username : '' }">${ name || `@${ username }` }</a>`;
		});
	}
	replaceChannels(str, message) {
		// since apostrophe escaped contains # we need to unescape it
		return str.replace(/&#39;/g, '\'').replace(this.channelMentionRegex, (match, prefix, name) => {
			if (!message.temp && !(message.channels && message.channels.find((c) => c.name === name))) {
				return match;
			}

			return `${ prefix }<a class="mention-link" data-channel="${ name }">${ `#${ name }` }</a>`;
		});
	}
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
