/**
 * @jest-environment node
 */
import type { ClassificationBannersConfig } from '@rocket.chat/abac';
import { ajv } from '@rocket.chat/rest-typings';

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

const { banner } = validConfig;
const [attribute] = validConfig.attributes;
const [value] = attribute.values;

describe('classification banners JSON schema (v1 enforcement contract)', () => {
	it('accepts a complete document typed as ClassificationBannersConfig', () => {
		expect(validate(validConfig)).toBe(true);
	});

	it.each([
		['a single nonAbacBanner', { enabled: true, text: 'UNCLASSIFIED', color: '#007a33' }],
		[
			'a single nonAbacBanner with a match',
			{ enabled: true, text: 'UNCLASSIFIED', color: '#007a33', match: { type: ['private'], federated: true } },
		],
		[
			'a list of nonAbacBanner entries',
			[
				{ enabled: true, text: 'PERSONAL', color: '#502b85', match: { type: ['direct'] } },
				{ enabled: false, text: 'EXTERNAL', color: '#6C727A', match: { type: ['omnichannel'] } },
				{ enabled: true, text: 'TEAM', color: '#0033a0', match: { team: true, discussion: false } },
				{ enabled: true, text: 'UNCLASSIFIED', color: '#007a33' },
			],
		],
		['a match with an empty type list', { enabled: true, text: 'UNCLASSIFIED', color: '#007a33', match: { type: [] } }],
	])('accepts a document with %s', (_name, nonAbacBanner) => {
		expect(validate({ ...validConfig, nonAbacBanner })).toBe(true);
	});

	it.each([
		['wrong version', { ...validConfig, version: 2 }],
		['missing banner option (colorMode)', { ...validConfig, banner: { ...banner, colorMode: undefined } }],
		['empty delimiter', { ...validConfig, banner: { ...banner, delimiter: '' } }],
		['oversized delimiter', { ...validConfig, banner: { ...banner, delimiter: 'x'.repeat(9) } }],
		['empty fallbackText', { ...validConfig, banner: { ...banner, fallbackText: '' } }],
		['malformed fallbackColor', { ...validConfig, banner: { ...banner, fallbackColor: 'red' } }],
		['unknown banner option', { ...validConfig, banner: { ...banner, position: 'top' } }],
		['unknown top-level property', { ...validConfig, source: 'idp' }],
		['empty attributes', { ...validConfig, attributes: [] }],
		['identical duplicate attributes', { ...validConfig, attributes: [attribute, attribute] }],
		['missing attribute field (drivesColor)', { ...validConfig, attributes: [{ ...attribute, drivesColor: undefined }] }],
		['uppercase attribute id', { ...validConfig, attributes: [{ ...attribute, id: 'Classification' }] }],
		['invalid labelSeparator', { ...validConfig, attributes: [{ ...attribute, labelSeparator: '::' }] }],
		['invalid valueSeparator', { ...validConfig, attributes: [{ ...attribute, valueSeparator: '|' }] }],
		['groupThreshold of 1', { ...validConfig, attributes: [{ ...attribute, groupThreshold: 1 }] }],
		['groupThreshold above 20', { ...validConfig, attributes: [{ ...attribute, groupThreshold: 21 }] }],
		['empty values', { ...validConfig, attributes: [{ ...attribute, values: [] }] }],
		['identical duplicate values', { ...validConfig, attributes: [{ ...attribute, values: [value, value] }] }],
		['value with 3-digit color', { ...validConfig, attributes: [{ ...attribute, values: [{ ...value, color: '#fff' }] }] }],
		['value missing label', { ...validConfig, attributes: [{ ...attribute, values: [{ ...value, label: undefined }] }] }],
		['nonAbacBanner missing enabled', { ...validConfig, nonAbacBanner: { text: 'X', color: '#000000' } }],
		['nonAbacBanner missing text', { ...validConfig, nonAbacBanner: { enabled: true, color: '#000000' } }],
		['nonAbacBanner with empty text', { ...validConfig, nonAbacBanner: { enabled: true, text: '', color: '#000000' } }],
		['nonAbacBanner missing color', { ...validConfig, nonAbacBanner: { enabled: true, text: 'X' } }],
		['nonAbacBanner with 3-digit color', { ...validConfig, nonAbacBanner: { enabled: true, text: 'X', color: '#fff' } }],
		['unknown nonAbacBanner option', { ...validConfig, nonAbacBanner: { enabled: true, text: 'X', color: '#000000', position: 'top' } }],
		['empty nonAbacBanner list', { ...validConfig, nonAbacBanner: [] }],
		['invalid entry in a nonAbacBanner list', { ...validConfig, nonAbacBanner: [{ enabled: true, text: 'X' }] }],
		['unknown match type', { ...validConfig, nonAbacBanner: { enabled: true, text: 'X', color: '#000000', match: { type: ['channel'] } } }],
		[
			'duplicate match type',
			{ ...validConfig, nonAbacBanner: { enabled: true, text: 'X', color: '#000000', match: { type: ['direct', 'direct'] } } },
		],
		['unknown match key', { ...validConfig, nonAbacBanner: { enabled: true, text: 'X', color: '#000000', match: { encrypted: true } } }],
		[
			'non-boolean match flag',
			{ ...validConfig, nonAbacBanner: { enabled: true, text: 'X', color: '#000000', match: { federated: 'yes' } } },
		],
	])('rejects %s', (_name, config) => {
		expect(validate(config)).toBe(false);
	});
});
