import punctuationEndCharacters from 'unicode/category/Pe.js';
import finalPunctuationCharacters from 'unicode/category/Pf.js';
import initialPunctuationCharacters from 'unicode/category/Pi.js';
import punctuationStartCharacters from 'unicode/category/Ps.js';

import { readJson, writeJson } from './utils.mjs';

const filterMirroredCharacters = (charCategory) =>
	Object.values(charCategory)
		.filter(({ mirrored }) => mirrored === 'Y')
		.map(({ symbol }) => symbol);

const startCharacters = [
	...filterMirroredCharacters(punctuationStartCharacters),
	...filterMirroredCharacters(initialPunctuationCharacters),
];

const endCharacters = [...filterMirroredCharacters(punctuationEndCharacters), ...filterMirroredCharacters(finalPunctuationCharacters)];

export const getMappedGlyphs = () => readJson('./glyphsMapping.json');

const assignCharactersFor = async (name, type) => {
	const glyphsMapping = await getMappedGlyphs();

	if (glyphsMapping[name]) {
		return glyphsMapping[name];
	}

	if (type === 'dir') {
		const i =
			Math.max(
				...Object.values(glyphsMapping)
					.map(({ start }) => startCharacters.indexOf(start))
					.filter((index) => index > -1),
			) + 2;

		if (startCharacters.length <= i) {
			throw Error('more directional icons than possible');
		}

		glyphsMapping[name] = {
			start: startCharacters[i],
			end: endCharacters[i],
		};
	}

	if (!type) {
		const i =
			Math.max(
				...Object.values(glyphsMapping)
					.map(({ start }) => start.codePointAt(0))
					.filter((codePoint) => codePoint >= 0xe000),
			) -
			0xe000 +
			2;
		glyphsMapping[name] = {
			start: String.fromCodePoint(0xe000 + i),
		};
	}

	await writeJson('./glyphsMapping.json')(glyphsMapping);

	return glyphsMapping[name];
};

let pendingAssignment = Promise.resolve();

export const nextCharactersFor = (name, type) => {
	// serialized: concurrent assignments would clobber glyphsMapping.json
	const assignment = pendingAssignment.then(() => assignCharactersFor(name, type));
	pendingAssignment = assignment.catch(() => undefined);
	return assignment;
};
