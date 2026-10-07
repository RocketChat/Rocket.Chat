import { Readable } from 'stream';

import svg2ttf from 'svg2ttf';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';

import { nextCharactersFor } from './glyphs.mjs';
import { mirrorSvg } from './svg.mjs';
import { readSource, readJson } from './utils.mjs';

const createReadableFromString = (content) => {
	const stream = new Readable();
	stream.push(content);
	stream.push(null);
	return stream;
};

/**
 *
 * @param {{ name: string; type: string; path: string }[]} icons
 * @returns {Buffer}
 */
export const createSvgBuffer = async (icons) => {
	const fontStream = new SVGIcons2SVGFontStream({
		fontName: 'RocketChat',
		fontHeight: 1024,
		normalize: true,
		log: () => undefined,
	});

	const glyphs = await Promise.all(
		icons.map(async ({ name, type, path }) => {
			const content = await readSource(path);
			const { start: startCharacter, end: endCharacter } = await nextCharactersFor(name, type);

			return {
				name,
				content,
				startCharacter,
				endCharacter,
				mirroredContent: endCharacter ? await mirrorSvg(content) : undefined,
			};
		}),
	);

	// written in the (sorted) icons order, not I/O completion order
	for (const glyph of glyphs) {
		const stream = createReadableFromString(glyph.content);
		stream.metadata = {
			name: glyph.name,
			unicode: [glyph.startCharacter],
		};

		fontStream.write(stream);

		if (glyph.endCharacter) {
			const stream = createReadableFromString(glyph.mirroredContent);
			stream.metadata = {
				name: `${glyph.name}-mirror`,
				unicode: [glyph.endCharacter],
			};

			fontStream.write(stream);
		}
	}

	return new Promise((resolve, reject) => {
		/** @type Uint8Array[] */
		const buffers = [];

		const encoder = new TextEncoder();

		fontStream
			.on('data', (data) => buffers.push(encoder.encode(data)))
			.on('error', (error) => reject(error))
			.on('finish', () => resolve(Buffer.concat(buffers)));

		fontStream.end();
	});
};

export const createTtfBuffer = async (svgBuffer) => {
	const pkg = await readJson('./package.json');
	return Buffer.from(
		svg2ttf(svgBuffer.toString('utf8'), {
			copyright: pkg.copyright,
			description: pkg.description,
			url: pkg.homepage,
			version: pkg.version.split('.').slice(0, 2).join('.'),
		}).buffer,
	);
};

export const createWoffBuffer = async (ttfBuffer) => Buffer.from(ttf2woff(new Uint8Array(ttfBuffer)).buffer);

export const createWoff2Buffer = async (ttfBuffer) => Buffer.from(ttf2woff2(new Uint8Array(ttfBuffer)).buffer);

export const createEotBuffer = async (ttfBuffer) => Buffer.from(ttf2eot(new Uint8Array(ttfBuffer)).buffer);
