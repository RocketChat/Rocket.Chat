import { Random } from 'meteor/random';
import katex from 'katex';
import { unescapeHTML, escapeHTML } from '@rocket.chat/string-helpers';

import 'katex/dist/katex.min.css';
import './style.css';

class Boundary {
	length() {
		return this.end - this.start;
	}

	extract(str) {
		return str.substr(this.start, this.length());
	}
}

class Katex {
	constructor(katex, { dollarSyntax, parenthesisSyntax }) {
		this.katex = katex;
		this.delimitersMap = [
			{
				opener: '\\[',
				closer: '\\]',
				displayMode: true,
				enabled: () => parenthesisSyntax,
			},
			{
				opener: '\\(',
				closer: '\\)',
				displayMode: false,
				enabled: () => parenthesisSyntax,
			},
			{
				opener: '$$',
				closer: '$$',
				displayMode: true,
				enabled: () => dollarSyntax,
			},
			{
				opener: '$',
				closer: '$',
				displayMode: false,
				enabled: () => dollarSyntax,
			},
		];
	}

	findOpeningDelimiter(str, start) {
		const matches = this.delimitersMap
			.filter((options) => options.enabled())
			.map((options) => ({
				options,
				pos: str.indexOf(options.opener, start),
			}));

		const positions = matches.filter(({ pos }) => pos >= 0).map(({ pos }) => pos);

		// No opening delimiters were found
		if (positions.length === 0) {
			return null;
		}

		// Take the first delimiter found
		const minPos = Math.min(...positions);

		const matchIndex = matches.findIndex(({ pos }) => pos === minPos);

		const match = matches[matchIndex];
		return match;
	}

	getLatexBoundaries(str, { options: { closer }, pos }) {
		const closerIndex = str.substr(pos + closer.length).indexOf(closer);
		if (closerIndex < 0) {
			return null;
		}

		const inner = new Boundary();
		const outer = new Boundary();

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
		latex = unescapeHTML(latex);
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
			return this.katex.renderToString(latex, {
				displayMode,
				macros: {
					'\\href': '\\@secondoftwo',
				},
			});
		} catch ({ message }) {
			return `<div class="katex-error katex-${displayMode ? 'block' : 'inline'}-error">${escapeHTML(message)}</div>`;
		}
	};

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
		if (typeof message === 'string') {
			return this.render(message, this.renderLatex);
		}

		if (!message.html?.trim()) {
			return message;
		}

		if (!message.tokens) {
			message.tokens = [];
		}

		message.html = this.render(message.html, (latex, displayMode) => {
			const token = `=!=${Random.id()}=!=`;
			message.tokens.push({
				token,
				text: this.renderLatex(latex, displayMode),
			});
			return token;
		});

		return message;
	};
}

export const createKatexMessageRendering = (options) => {
	const instance = new Katex(katex, options);
	return (message) => instance.renderMessage(message);
};

export const getKatexHtml = (text, katex) => {
	return createKatexMessageRendering({ dollarSyntax: katex.dollarSyntaxEnabled, parenthesisSyntax: katex.parenthesisSyntaxEnabled })(text);
};
