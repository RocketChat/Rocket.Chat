import SaxLtx from 'ltx/lib/parsers/ltx';

import { TopLevelBoundaries } from './TopLevelBoundaries';

const HEADER = "<stream:stream xmlns='jabber:server' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>";

const ltxEnds = (input: string): number[] => {
	const parser = new SaxLtx();
	const ends: number[] = [];
	let depth = 0;
	let pos = 0;
	parser.on('startElement', () => {
		depth += 1;
		if (depth === 1) {
			ends.push(pos + 1);
		}
	});
	parser.on('endElement', () => {
		depth -= 1;
		if (depth <= 1) {
			ends.push(pos + 1);
		}
	});
	for (; pos < input.length; pos++) {
		parser.write(input[pos]);
	}
	return ends;
};

const scanInPieces = (input: string): number[] => {
	const boundaries = new TopLevelBoundaries();
	return [...input].flatMap((char, offset) => boundaries.scan(char).map((end) => offset + end));
};

describe('TopLevelBoundaries', () => {
	it.each([
		`${HEADER}<message><body>hi</body></message></stream:stream>`,
		`${HEADER}<message id='</message><message>'><body>x</body></message>`,
		`${HEADER}<message id="a>b"/><iq/>`,
		`${HEADER}<m a="'>" b='">'/>`,
		`${HEADER}<presence\n\tfrom = 'a' /><message a=b>t</message>`,
		`${HEADER}<a><b/><c x='>'></c></a>`,
		`${HEADER}<message id='&apos;>&gt;'>a &lt; b > c</message>`,
		`${HEADER}< x>y</ x><//m>`,
	])('ends top-level elements where ltx does: %j', (input) => {
		const expected = ltxEnds(input);
		expect(new TopLevelBoundaries().scan(input)).toEqual(expected);
		expect(scanInPieces(input)).toEqual(expected);
	});
});
