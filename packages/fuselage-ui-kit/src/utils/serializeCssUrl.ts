export const serializeCssUrl = (url: string): string =>
	`url("${url.replace(/[\p{Cc}"\\]/gu, (character) =>
		character === '"' || character === '\\' ? `\\${character}` : `\\${character.codePointAt(0)?.toString(16)} `,
	)}")`;
