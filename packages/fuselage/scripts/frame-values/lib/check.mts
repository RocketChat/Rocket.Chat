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

/** A `transform` that starts with `none` and goes on: it is not a valid value, and the browser drops the whole declaration. */
export const transformProblems = (name: string, body: string) => {
	const problems: string[] = [];

	const startsWithNone = /\btransform['"]?\s*:\s*(?:(?<a>['"`])\s*none\s+[^'"`]*\k<a>|\{[^}]*?(?<b>['"`])\s*none\s+[^'"`]*\k<b>)/g;

	for (const match of body.matchAll(startsWithNone)) {
		problems.push(`${name}:${lineOf(body, match.index)}: a transform that starts with \`none\` is dropped, state the others alone`);
	}

	return problems;
};
