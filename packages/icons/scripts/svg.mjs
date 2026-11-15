import { promisify } from 'util';

import { parseString, Builder } from 'xml2js';

import { readSource } from './utils.mjs';

const xmlBuilder = new Builder({ headless: true });

export const mirrorSvg = async (content) => {
	const xml = await promisify(parseString)(content);
	const [x1, , x2] = xml.svg.$.viewBox.split(' ');
	xml.svg.$.transform = `translate(${parseInt(x2, 10) - parseInt(x1, 10)} 0) scale(-1 1)`;
	return xmlBuilder.buildObject(xml);
};

export const createSvgIcons = (icons) =>
	Promise.all(
		icons.map(async ({ name, type, path }) => {
			const content = await readSource(path);
			const {
				svg: {
					$: { viewBox },
					...elements
				},
			} = await promisify(parseString)(content);

			const xml = xmlBuilder.buildObject({
				svg: {
					$: {
						xmlns: 'http://www.w3.org/2000/svg',
						viewBox,
						class: type === 'dir' ? 'rcx-svg--directional' : undefined,
						fill: 'currentColor',
					},
					...elements,
				},
			});

			return { name, type, viewBox, elements, xml };
		}),
	);

export const createSvgSprite = async (svgIcons) =>
	[
		'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none">',
		...svgIcons.map(({ name, type, viewBox, elements }) =>
			xmlBuilder.buildObject({
				symbol: {
					$: {
						id: `icon-${name}`,
						viewBox,
						class: type === 'dir' ? 'rcx-svg--directional' : undefined,
						fill: 'currentColor',
					},
					...elements,
				},
			}),
		),
		'</svg>',
	].join('\n');
