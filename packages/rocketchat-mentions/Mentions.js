/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/
import _ from 'underscore';
export default class {
	constructor({pattern, useRealName, me}) {
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
		return new RegExp(`@(${ this.pattern })`, 'gm');
	}
	get channelMentionRegex() {
		return new RegExp(`^#(${ this.pattern })| #(${ this.pattern })|^<p>#(${ this.pattern })`, 'gm');
	}
	replaceUsers(str, message, me) {
		return str.replace(this.userMentionRegex, (match, username) => {
			if (['all', 'here'].includes(username)) {
				return `<a class="mention-link mention-link-me mention-link-all background-attention-color">${ match }</a>`;
			}

			const mentionObj = _.findWhere(message.mentions, {username});
			if (message.temp == null && mentionObj == null) {
				return match;
			}
			const name = this.useRealName && mentionObj && mentionObj.name;

			return `<a class="mention-link ${ username === me ? 'mention-link-me background-primary-action-color':'' }" data-username="${ username }" title="${ name ? username : '' }">${ name || match }</a>`;
		});
	}
	replaceChannels(str, message) {
		//since apostrophe escaped contains # we need to unescape it
		return str.replace(/&#39;/g, '\'').replace(this.channelMentionRegex, (match, n1, n2, n3) => {
			const name = n1 || n2 || n3;
			if (message.temp == null && _.findWhere(message.channels, {name}) == null) {
				return match;
			}

			// remove the link from inside the link and put before
			if (/^\s/.test(match)) {
				return ` <a class="mention-link" data-channel="${ name }">${ match.trim() }</a>`;
			}

			return `<a class="mention-link" data-channel="${ name }">${ match }</a>`;
		});
	}
	getUserMentions(str) {
		return str.match(this.userMentionRegex) || [];
	}
	getChannelMentions(str) {
		return (str.match(this.channelMentionRegex) || []).map(match => match.trim());
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
