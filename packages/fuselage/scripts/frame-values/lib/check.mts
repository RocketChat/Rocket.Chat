const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/**
 * What a generator module states that a frame cannot hold: a CSS custom property or a length with a CSS unit, which only
 * the web reads, and a `hoverStyle`-like object, which the zero-runtime compiler drops without a diagnostic.
 */
export const moduleProblems = (name: string, text: string) => {
	const problems: string[] = [];

	for (const match of text.matchAll(/var\(\s*--[\w-]+|(?<![\w-])--[\w-]+/g)) {
		problems.push(`${name}:${lineOf(text, match.index)}: \`${match[0]}\` is a CSS custom property, use themed() or a token`);
	}

	for (const match of text.matchAll(/(['"`])-?[\d.]+(?:[a-z]+|%)\1/gi)) {
		problems.push(`${name}:${lineOf(text, match.index)}: ${match[0]} has a CSS unit, use space() or offScale()`);
	}

	for (const match of text.matchAll(/\b(?:hover|press|focus|focusVisible|focusWithin|disabled)Style\b/g)) {
		problems.push(
			`${name}:${lineOf(text, match.index)}: ${match[0]} is dropped by the zero build, state each value as \`{ default, hover }\``,
		);
	}

	return problems;
};

const FONT_PROPERTY = /["']?\b(fontSize|lineHeight|fontWeight|letterSpacing|fontFamily)\b["']?\s*:\s*/g;

/** The source of the value that starts at `start`: a whole object when it opens one, else up to the next `,`, `}` or line. */
const valueAt = (body: string, start: number) => {
	if (body[start] !== '{') {
		return body.slice(start).split(/[,}\n]/, 1)[0];
	}

	let depth = 0;
	for (let index = start; index < body.length; index++) {
		if (body[index] === '{') {
			depth++;
		} else if (body[index] === '}') {
			depth--;
		}
		if (depth === 0) {
			return body.slice(start, index + 1);
		}
	}
	return body.slice(start);
};

/**
 * A `$` token in a font property, in any state or variant of it. Tamagui reads those properties only from font tokens, so
 * a size or theme token would be written to the stylesheet as the literal, invalid `font-size: $size.x24`.
 */
export const fontReferenceProblems = (name: string, body: string) => {
	const problems: string[] = [];

	for (const match of body.matchAll(FONT_PROPERTY)) {
		const reference = valueAt(body, match.index + match[0].length).match(/(['"`])(\$[\w.-]+)\1/);
		if (reference) {
			problems.push(
				`${name}:${lineOf(body, match.index)}: \`${match[1]}: ${reference[2]}\` is written out as invalid CSS, a font property takes no token. ` +
					`Spread fontScale() for a step of the type scale, or state the length as a number of pixels, or rem(n) for the rem of a size() step (rem(24) for size('x24'))`,
			);
		}
	}

	return problems;
};

/** A `transform` that starts with `none` and goes on: it is not a valid value, and the browser drops the whole declaration. */
export const transformProblems = (name: string, body: string) => {
	const problems: string[] = [];

	const startsWithNone = /\btransform['"]?\s*:\s*(?:(?<a>['"`])\s*none\s+[^'"`]*\k<a>|\{[^}]*?(?<b>['"`])\s*none\s+[^'"`]*\k<b>)/g;

	for (const match of body.matchAll(startsWithNone)) {
		problems.push(`${name}:${lineOf(body, match.index)}: a transform that starts with \`none\` is dropped, state the others alone`);
	}

	return problems;
};
