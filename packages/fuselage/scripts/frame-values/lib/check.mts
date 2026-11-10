import { spacingScale } from '../../../src/styleTokens.ts';

// A spacing or font value comes from `spacing()`, `fontScale()` or, off the scale, `offScale()`; a raw length there would not
const spacingOrFont =
	/['"]?\b(?:padding|margin|gap|rowGap|columnGap|row-gap|column-gap|fontSize|font-size|lineHeight|line-height|letterSpacing|letter-spacing)[\w-]*['"]?\s*:\s*/g;

const valueEnd = (text: string, from: number) => {
	let depth = 0;
	for (let i = from; i < text.length; i++) {
		if ('([{'.includes(text[i])) {
			depth++;
		} else if (')]}'.includes(text[i])) {
			if (depth === 0) {
				return i;
			}
			depth--;
		} else if (depth === 0 && ',;\n'.includes(text[i])) {
			return i;
		}
	}
	return text.length;
};

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/** The raw px/rem lengths and the off-scale `spacing()` steps in a generator module. */
export const moduleProblems = (name: string, text: string) => {
	const problems: string[] = [];

	for (const match of text.matchAll(spacingOrFont)) {
		const from = match.index + match[0].length;
		const value = text.slice(from, valueEnd(text, from)).trim();
		if (/\d(?:px|rem)\b|\bpx\(|^-?[1-9][\d.]*$/.test(value)) {
			problems.push(
				`${name}:${lineOf(text, match.index)}: raw length in \`${match[0].trim()} ${value}\`, use spacing(), fontScale() or offScale()`,
			);
		}
	}

	for (const match of text.matchAll(/\bspacing\(['"](?:-|neg-)?(x\d+)['"]\)/g)) {
		if (!Object.hasOwn(spacingScale, match[1])) {
			problems.push(`${name}:${lineOf(text, match.index)}: ${match[1]} is not on the spacing scale, use offScale()`);
		}
	}

	return problems;
};

/** The custom properties some generator or source assigns to a spacing or font property, so hand-written CSS can't set them raw. */
export const spacingProperties = (texts: string[]) => {
	const properties = new Set<string>();
	for (const text of texts) {
		for (const match of text.matchAll(spacingOrFont)) {
			const from = match.index + match[0].length;
			for (const [, name] of text.slice(from, valueEnd(text, from)).matchAll(/var\((--[\w-]+)/g)) {
				properties.add(name);
			}
		}
	}
	return properties;
};

/** The raw lengths in a stylesheet outside its generated sections: those hold no spacing or type by hand either. */
export const stylesheetProblems = (name: string, text: string, properties: Set<string>) => {
	const problems: string[] = [];
	const handWritten = text.replace(/\/\* generated [\s\S]*?\/\* end of generated[^*]*\*\//g, (section) => section.replace(/[^\n]/g, ' '));

	for (const match of handWritten.matchAll(/^[ \t]*([\w-]+)\s*:\s*([^;{}]*)/gm)) {
		const [, property, value] = match;
		const spacingOrFontProperty = property.startsWith('--')
			? properties.has(property)
			: /^(?:padding|margin|gap|row-gap|column-gap|font-size|line-height|letter-spacing)/.test(property);
		if (spacingOrFontProperty && /\d(?:px|r?em)\b/.test(value)) {
			problems.push(
				`src/${name}:${lineOf(text, match.index)}: raw length in \`${property}: ${value.trim()}\`, move it into a generated section`,
			);
		}
	}

	return problems;
};
