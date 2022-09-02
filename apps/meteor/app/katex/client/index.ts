import { Random } from 'meteor/random';
import KatexPackage from 'katex';
import { unescapeHTML, escapeHTML } from '@rocket.chat/string-helpers';
import 'katex/dist/katex.min.css';
import './style.css';
import type { IMessage } from '@rocket.chat/core-typings';

class Boundary {
	start: number;

	end: number;

	length(): number {
		return this.end - this.start;
	}

	extract(str: string): string {
		return str.substr(this.start, this.length());
	}
}

type Delimiter = {
	opener: string;
	closer: string;
	displayMode: boolean;
	enabled: () => boolean;
};

type OpeningDelimiter = { options: Delimiter; pos: number };

type LatexBoundary = { outer: Boundary; inner: Boundary };

class Katex {
	katex: KatexPackage;

	delimitersMap: Delimiter[];

	constructor(katex: KatexPackage, { dollarSyntax, parenthesisSyntax }: { dollarSyntax: boolean; parenthesisSyntax: boolean }) {
		this.katex = katex;
		this.delimitersMap = [
			{
				opener: '\\[',
				closer: '\\]',
				displayMode: true,
				enabled: (): boolean => parenthesisSyntax,
			},
			{
				opener: '\\(',
				closer: '\\)',
				displayMode: false,
				enabled: (): boolean => parenthesisSyntax,
			},
			{
				opener: '$$',
				closer: '$$',
				displayMode: true,
				enabled: (): boolean => dollarSyntax,
			},
			{
				opener: '$',
				closer: '$',
				displayMode: false,
				enabled: (): boolean => dollarSyntax,
			},
		];
	}

	findOpeningDelimiter(str: string, start: number): OpeningDelimiter | null {
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

	getLatexBoundaries(str: string, { options: { closer }, pos }: OpeningDelimiter): LatexBoundary | null {
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
	findLatex(str: string): (LatexBoundary & { options: Delimiter }) | null {
		let start = 0;
		let openingDelimiterMatch;

		while ((openingDelimiterMatch = this.findOpeningDelimiter(str, start++)) != null) {
			const match = this.getLatexBoundaries(str, openingDelimiterMatch);
			if (match?.inner.extract(str).trim().length) {
				return {
					...match,
					options: openingDelimiterMatch.options,
				};
			}
		}

		return null;
	}

	// Breaks a message to what comes before, after and to the content of a
	// matched latex block
	extractLatex(str: string, match: LatexBoundary): { before: string; latex: string; after: string } {
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
	renderLatex = (latex: string, displayMode: Delimiter['displayMode']): string => {
		try {
			return KatexPackage.renderToString(latex, {
				displayMode,
				macros: {
					'\\href': '\\@secondoftwo',
				},
			});
		} catch (e) {
			return `<div class="katex-error katex-${displayMode ? 'block' : 'inline'}-error">${escapeHTML(
				e instanceof Error ? e.message : String(e),
			)}</div>`;
		}
	};

	// Takes a string and renders all latex blocks inside it
	render(str: string, renderFunction: (latex: string, displayMode: Delimiter['displayMode']) => string): string {
		let result = '';
		while (this.findLatex(str) != null) {
			// Find the first latex block in the string
			const match = this.findLatex(str);
			if (!match) {
				continue;
			}

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

	public renderMessage(message: string): string;

	public renderMessage(message: IMessage): IMessage;

	public renderMessage(message: string | IMessage): string | IMessage {
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
			message.tokens?.push({
				token,
				text: this.renderLatex(latex, displayMode),
			});
			return token;
		});

		return message;
	}
}

export function createKatexMessageRendering(
	options: {
		dollarSyntax: boolean;
		parenthesisSyntax: boolean;
	},
	_isMessage: true,
): (message: IMessage) => IMessage;
export function createKatexMessageRendering(
	options: {
		dollarSyntax: boolean;
		parenthesisSyntax: boolean;
	},
	_isMessage: false,
): (message: string) => string;
export function createKatexMessageRendering(
	options: {
		dollarSyntax: boolean;
		parenthesisSyntax: boolean;
	},
	_isMessage: true | false,
): ((message: string) => string) | ((message: IMessage) => IMessage) {
	const instance = new Katex(KatexPackage, options);
	if (_isMessage) {
		return (message: IMessage): IMessage => instance.renderMessage(message);
	}
	return (message: string): string => instance.renderMessage(message);
}

export const getKatexHtml = (text: string, katex: { dollarSyntaxEnabled: boolean; parenthesisSyntaxEnabled: boolean }): string => {
	return createKatexMessageRendering(
		{ dollarSyntax: katex.dollarSyntaxEnabled, parenthesisSyntax: katex.parenthesisSyntaxEnabled },
		false,
	)(text);
};
