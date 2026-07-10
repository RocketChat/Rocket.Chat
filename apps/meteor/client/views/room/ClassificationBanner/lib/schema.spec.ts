/**
 * @jest-environment node
 */
import { ajv } from '@rocket.chat/rest-typings';

import type { ClassificationBannersConfig } from './types';
import schema from '../../../../../../../ee/packages/abac/docs/classification-banners.schema.json';

const validate = ajv.compile(schema);

const validConfig: ClassificationBannersConfig & { $schema: string } = {
	$schema: 'https://rocket.chat/schemas/classification-banners/v1.json',
	version: 1,
	enabled: true,
	banner: {
		style: 'classic',
		uppercase: true,
		monospace: false,
		delimiter: ' // ',
		colorMode: 'highest',
		fallbackText: 'NO CLASSIFICATION DATA',
		fallbackColor: '#6C727A',
	},
	attributes: [
		{
			id: 'classification',
			source: 'clearance.level',
			label: 'Classification level',
			showInBanner: true,
			showLabel: false,
			bannerLabel: '',
			labelSeparator: '',
			valueSeparator: '/',
			sortAlpha: false,
			groupThreshold: 0,
			multipleLabel: '',
			drivesColor: true,
			values: [
				{ source: 'TS', label: 'TOP SECRET', color: '#ff8c00' },
				{ source: 'U', label: 'UNCLASSIFIED', color: '#007a33' },
			],
		},
	],
};

// Not structuredClone: under jest it clones into the host realm, and ajv's fast-deep-equal
// rejects cross-realm objects by constructor, silently disabling the uniqueItems assertions.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const mutate = (change: (config: typeof validConfig) => void): unknown => {
	const config = clone(validConfig);
	change(config);
	return config;
};

describe('classification banners JSON schema (v1 enforcement contract)', () => {
	it('accepts a complete document typed as ClassificationBannersConfig', () => {
		expect(validate(validConfig)).toBe(true);
	});

	it.each([
		['wrong version', mutate((c) => Object.assign(c, { version: 2 }))],
		['missing banner option (colorMode)', mutate((c) => delete (c.banner as Partial<typeof c.banner>).colorMode)],
		['empty delimiter', mutate((c) => Object.assign(c.banner, { delimiter: '' }))],
		['oversized delimiter', mutate((c) => Object.assign(c.banner, { delimiter: 'x'.repeat(9) }))],
		['empty fallbackText', mutate((c) => Object.assign(c.banner, { fallbackText: '' }))],
		['malformed fallbackColor', mutate((c) => Object.assign(c.banner, { fallbackColor: 'red' }))],
		['unknown banner option', mutate((c) => Object.assign(c.banner, { position: 'top' }))],
		['unknown top-level property', mutate((c) => Object.assign(c, { source: 'idp' }))],
		['empty attributes', mutate((c) => Object.assign(c, { attributes: [] }))],
		['identical duplicate attributes', mutate((c) => c.attributes.push(clone(c.attributes[0])))],
		['missing attribute field (drivesColor)', mutate((c) => delete (c.attributes[0] as Partial<(typeof c.attributes)[0]>).drivesColor)],
		['uppercase attribute id', mutate((c) => Object.assign(c.attributes[0], { id: 'Classification' }))],
		['invalid labelSeparator', mutate((c) => Object.assign(c.attributes[0], { labelSeparator: '::' }))],
		['invalid valueSeparator', mutate((c) => Object.assign(c.attributes[0], { valueSeparator: '|' }))],
		['groupThreshold of 1', mutate((c) => Object.assign(c.attributes[0], { groupThreshold: 1 }))],
		['groupThreshold above 20', mutate((c) => Object.assign(c.attributes[0], { groupThreshold: 21 }))],
		['empty values', mutate((c) => Object.assign(c.attributes[0], { values: [] }))],
		['identical duplicate values', mutate((c) => c.attributes[0].values.push(clone(c.attributes[0].values[0])))],
		['value with 3-digit color', mutate((c) => Object.assign(c.attributes[0].values[0], { color: '#fff' }))],
		['value missing label', mutate((c) => delete (c.attributes[0].values[0] as Partial<(typeof c.attributes)[0]['values'][0]>).label)],
	])('rejects %s', (_name, config) => {
		expect(validate(config)).toBe(false);
	});
});
