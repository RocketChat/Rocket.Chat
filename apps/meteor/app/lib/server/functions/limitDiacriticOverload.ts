import GraphemeSplitter from 'grapheme-splitter';
import unorm from 'unorm';

const splitter = new GraphemeSplitter();

/**
 * Limits the excessive use of diacritical marks (Zalgo text) in the given input text.
 */
export function limitDiacriticOverload(text: string, maxMarks = 10) {
	if (!text.match(/\p{Mn}/gu)) {
		return text;
	}

	return splitter
		.splitGraphemes(text)
		.map((char) => {
			// Decompose the character into base and diacritical marks
			const decomposed = unorm.nfd(char);
			const baseChar = decomposed.charAt(0);
			console.log(`Base char: ${baseChar}`);
			const marks = decomposed.slice(1).split('');
			console.log(`Marks: ${marks}`);

			// Filter out excessive non-spacing marks
			let marksCount = 0;
			const limitedDecomposed = marks.reduce((acc, mark) => {
				if (mark.match(/\p{Mn}/u) && marksCount < maxMarks) {
					marksCount++;
					return acc + mark;
				}
				return acc;
			}, baseChar);

			return unorm.nfc(limitedDecomposed);
		})
		.join('');
}
