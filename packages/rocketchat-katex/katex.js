/*
 * KaTeX is a fast, easy-to-use JavaScript library for TeX math rendering on the web.
 * https://github.com/Khan/KaTeX
 */
import _ from 'underscore';
import s from 'underscore.string';

import katex from 'katex';

class Boundary {
	constructor() {}

	length() {
		return this.end - this.start;
	}

	extract(str) {
		return str.substr(this.start, this.length());
	}

}

class Katex {
	constructor() {
		this.delimiters_map = [
			{
				opener: '\\[',
				closer: '\\]',
				displayMode: true,
				enabled: () => {
					return this.parenthesis_syntax_enabled();
				}
			}, {
				opener: '\\(',
				closer: '\\)',
				displayMode: false,
				enabled: () => {
					return this.parenthesis_syntax_enabled();
				}
			}, {
				opener: '$$',
				closer: '$$',
				displayMode: true,
				enabled: () => {
					return this.dollar_syntax_enabled();
				}
			}, {
				opener: '$',
				closer: '$',
				displayMode: false,
				enabled: () => {
					return this.dollar_syntax_enabled();
				}
			}
		];
	}
	// Searches for the first opening delimiter in the string from a given position

	find_opening_delimiter(str, start) { // Search the string for each opening delimiter
		const matches = (() => {
			const map = this.delimiters_map;
			const results = [];

			map.forEach((op) => {
				if (op.enabled()) {
					results.push({
						options: op,
						pos: str.indexOf(op.opener, start)
					});
				}
			});
			return results;
		})();

		const positions = (() => {
			const results = [];
			matches.forEach((pos) => {
				if (pos.pos >= 0) {
					results.push(pos.pos);
				}
			});
			return results;
		})();

		// No opening delimiters were found
		if (positions.length === 0) {
			return null;
		}

		//Take the first delimiter found
		const pos = Math.min.apply(Math, positions);

		const match_index = (()=> {
			const results = [];
			matches.forEach((m) => {
				results.push(m.pos);
			});
			return results;
		})().indexOf(pos);

		const match = matches[match_index];
		return match;
	}

	// Returns the outer and inner boundaries of the latex block starting
	// at the given opening delimiter
	get_latex_boundaries(str, opening_delimiter_match) {
		const inner = new Boundary;
		const outer = new Boundary;

		// The closing delimiter matching to the opening one
		const closer = opening_delimiter_match.options.closer;
		outer.start = opening_delimiter_match.pos;
		inner.start = opening_delimiter_match.pos + closer.length;

		// Search for a closer delimiter after the opening one
		const closer_index = str.substr(inner.start).indexOf(closer);
		if (closer_index < 0) {
			return null;
		}
		inner.end = inner.start + closer_index;
		outer.end = inner.end + closer.length;
		return {
			outer,
			inner
		};
	}

	// Searches for the first latex block in the given string
	find_latex(str) {
		let start = 0;
		let opening_delimiter_match;

		while ((opening_delimiter_match = this.find_opening_delimiter(str, start++)) != null) {
			const match = this.get_latex_boundaries(str, opening_delimiter_match);
			if (match && match.inner.extract(str).trim().length) {
				match.options = opening_delimiter_match.options;
				return match;
			}
		}
		return null;
	}

	// Breaks a message to what comes before, after and to the content of a
	// matched latex block
	extract_latex(str, match) {
		const before = str.substr(0, match.outer.start);
		const after = str.substr(match.outer.end);
		let latex = match.inner.extract(str);
		latex = s.unescapeHTML(latex);
		return {
			before,
			latex,
			after
		};
	}

	// Takes a latex math string and the desired display mode and renders it
	// to HTML using the KaTeX library
	render_latex(latex, displayMode) {
		let rendered;
		try {
			rendered = katex.renderToString(latex, {
				displayMode
			});
		} catch (error) {
			const e = error;
			const display_mode = displayMode ? 'block' : 'inline';
			rendered = `<div class="katex-error katex-${ display_mode }-error">`;
			rendered += `${ s.escapeHTML(e.message) }`;
			rendered += '</div>';
		}
		return rendered;
	}

	// Takes a string and renders all latex blocks inside it
	render(str, render_func) {
		let result = '';
		while (this.find_latex(str) != null) {
			// Find the first latex block in the string
			const match = this.find_latex(str);
			const parts = this.extract_latex(str, match);

			// Add to the reuslt what comes before the latex block as well as
			// the rendered latex content
			const rendered = render_func(parts.latex, match.options.displayMode);
			result += parts.before + rendered;
			// Set what comes after the latex block to be examined next
			str = parts.after;
		}
		return result += str;
	}

	// Takes a rocketchat message and renders latex in its content
	render_message(message) {
		//Render only if enabled in admin panel
		let render_func;
		if (this.katex_enabled()) {
			let msg = message;
			if (!_.isString(message)) {
				if (s.trim(message.html)) {
					msg = message.html;
				} else {
					return message;
				}
			}
			if (_.isString(message)) {
				render_func = (latex, displayMode) => {
					return this.render_latex(latex, displayMode);
				};
			} else {
				if (message.tokens == null) {
					message.tokens = [];
				}
				render_func = (latex, displayMode) => {
					const token = `=!=${ Random.id() }=!=`;
					message.tokens.push({
						token,
						text: this.render_latex(latex, displayMode)
					});
					return this.render_latex(latex, displayMode);
				};
			}
			msg = this.render(msg, render_func);
			if (!_.isString(message)) {
				message.html = msg;
			} else {
				message = msg;
			}
		}
		return message;
	}

	katex_enabled() {
		return RocketChat.settings.get('Katex_Enabled');
	}

	dollar_syntax_enabled() {
		return RocketChat.settings.get('Katex_Dollar_Syntax');
	}

	parenthesis_syntax_enabled() {
		return RocketChat.settings.get('Katex_Parenthesis_Syntax');
	}

}

RocketChat.katex = new Katex;

const cb = RocketChat.katex.render_message.bind(RocketChat.katex);

RocketChat.callbacks.add('renderMessage', cb, RocketChat.callbacks.priority.HIGH - 1, 'katex');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatKatex', function(text) {
		return RocketChat.katex.render_message(text);
	});
}
