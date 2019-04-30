import { Random } from 'meteor/random';
import _ from 'underscore';
import s from 'underscore.string';
import katex from 'katex';

import { callbacks } from '../../callbacks';
import { settings } from '../../settings';

class Boundary {
	length() {
		return this.end - this.start;
	}

	extract(str) {
		return str.substr(this.start, this.length());
	}
}

class Katex {
	constructor() {
		this.delimitersMap = [
			{
				opener: '\\[',
				closer: '\\]',
				displayMode: true,
				enabled: () => this.isParenthesisSyntaxEnabled(),
			}, {
				opener: '\\(',
				closer: '\\)',
				displayMode: false,
				enabled: () => this.isParenthesisSyntaxEnabled(),
			}, {
				opener: '$$',
				closer: '$$',
				displayMode: true,
				enabled: () => this.isDollarSyntaxEnabled(),
			}, {
				opener: '$',
				closer: '$',
				displayMode: false,
				enabled: () => this.isDollarSyntaxEnabled(),
			},
		];
	}

	findOpeningDelimiter(str, start) {
		const matches = this.delimitersMap.filter((options) => options.enabled()).map((options) => ({
			options,
			pos: str.indexOf(options.opener, start),
		}));

		const positions = matches.filter(({ pos }) => pos >= 0).map(({ pos }) => pos);

		// No opening delimiters were found
		if (positions.length === 0) {
			return null;
		}

		// Take the first delimiter found
		const minPos = Math.min.apply(Math, positions);

		const matchIndex = matches.findIndex(({ pos }) => pos === minPos);

		const match = matches[matchIndex];
		return match;
	}

	getLatexBoundaries(str, { options: { closer }, pos }) {
		const closerIndex = str.substr(pos + closer.length).indexOf(closer);
		if (closerIndex < 0) {
			return null;
		}

		const inner = new Boundary;
		const outer = new Boundary;

		inner.start = pos + closer.length;
		inner.end = inner.start + closerIndex;

		outer.start = pos;
		outer.end = inner.end + closer.length;

		return {
			outer,
			inner,
		};
	}

	// Searches for the first latex block in the given string
	findLatex(str) {
		let start = 0;
		let openingDelimiterMatch;

		while ((openingDelimiterMatch = this.findOpeningDelimiter(str, start++)) != null) {
			const match = this.getLatexBoundaries(str, openingDelimiterMatch);
			if (match && match.inner.extract(str).trim().length) {
				match.options = openingDelimiterMatch.options;
				return match;
			}
		}

		return null;
	}

	// Breaks a message to what comes before, after and to the content of a
	// matched latex block
	extractLatex(str, match) {
		const before = str.substr(0, match.outer.start);
		const after = str.substr(match.outer.end);
		let latex = match.inner.extract(str);
		latex = s.unescapeHTML(latex);
		return {
			before,
			latex,
			after,
		};
	}

	// Takes a latex math string and the desired display mode and renders it
	// to HTML using the KaTeX library
	renderLatex = (latex, displayMode) => {
		try {
			return katex.renderToString(latex, {
				displayMode,
				macros: {
					'\\href': '\\@secondoftwo',
				},
			});
		} catch ({ message }) {
			return `<div class="katex-error katex-${ displayMode ? 'block' : 'inline' }-error">` +
				`${ s.escapeHTML(message) }</div>`;
		}
	}

	// Takes a string and renders all latex blocks inside it
	render(str, renderFunction) {
		let result = '';
		while (this.findLatex(str) != null) {
			// Find the first latex block in the string
			const match = this.findLatex(str);
			const parts = this.extractLatex(str, match);

			// Add to the reuslt what comes before the latex block as well as
			// the rendered latex content
			const rendered = renderFunction(parts.latex, match.options.displayMode);
			result += parts.before + rendered;
			// Set what comes after the latex block to be examined next
			str = parts.after;
		}
		result += str;
		return result;
	}

	renderMessage = (message) => {
		if (!this.isEnabled()) {
			return message;
		}

		if (_.isString(message)) {
			return this.render(message, this.renderLatex);
		}

		if (!s.trim(message.html)) {
			return message;
		}

		if (message.tokens == null) {
			message.tokens = [];
		}

		message.html = this.render(message.html, (latex, displayMode) => {
			const token = `=!=${ Random.id() }=!=`;
			message.tokens.push({
				token,
				text: this.renderLatex(latex, displayMode),
			});
			return token;
		});

		return message;
	}

	isEnabled = () => settings.get('Katex_Enabled')

	isDollarSyntaxEnabled = () => settings.get('Katex_Dollar_Syntax')

	isParenthesisSyntaxEnabled = () => settings.get('Katex_Parenthesis_Syntax')
}

const instance = new Katex;

callbacks.add('renderMessage', instance.renderMessage, callbacks.priority.HIGH - 1, 'katex');

export default instance;
