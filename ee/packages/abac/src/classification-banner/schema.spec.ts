import { readFileSync } from 'fs';
import path from 'path';

import { ajv } from '@rocket.chat/rest-typings';

import type { ClassificationBannersConfig } from './types';

const validate = ajv.compile(JSON.parse(readFileSync(path.join(__dirname, '../../docs/classification-banners.schema.json'), 'utf8')));

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
const defaultEntry = { enabled: true, text: 'UNCLASSIFIED', color: '#007a33' };

describe('classification banners JSON schema (v1 enforcement contract)', () => {
	it('accepts a complete document typed as ClassificationBannersConfig', () => {
		expect(validate(validConfig)).toBe(true);
	});

	it.each([
		['a single default entry', [defaultEntry]],
		[
			'a list of nonAbacBanner entries ending with the default',
			[
				{ enabled: true, text: 'PERSONAL', color: '#502b85', match: { type: ['direct'] } },
				{ enabled: false, text: 'EXTERNAL', color: '#6C727A', match: { federated: true } },
				{ enabled: true, text: 'TEAM', color: '#0033a0', match: { team: true, discussion: false } },
				defaultEntry,
			],
		],
		['a disabled entry without a match next to an enabled default', [{ ...defaultEntry, enabled: false }, defaultEntry]],
		['an enabled default before a matched entry', [defaultEntry, { ...defaultEntry, text: 'PERSONAL', match: { type: ['direct'] } }]],
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
		['a single nonAbacBanner object instead of a list', { ...validConfig, nonAbacBanner: defaultEntry }],
		['empty nonAbacBanner list', { ...validConfig, nonAbacBanner: [] }],
		['nonAbacBanner list without a default entry', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { type: ['direct'] } }] }],
		['nonAbacBanner whose only default is disabled', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, enabled: false }] }],
		['nonAbacBanner entry with an empty match', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: {} }, defaultEntry] }],
		['match with an empty type list', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { type: [] } }, defaultEntry] }],
		['nonAbacBanner entry missing enabled', { ...validConfig, nonAbacBanner: [{ text: 'X', color: '#000000' }] }],
		['nonAbacBanner entry missing text', { ...validConfig, nonAbacBanner: [{ enabled: true, color: '#000000' }] }],
		['nonAbacBanner entry with empty text', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, text: '' }] }],
		['nonAbacBanner entry missing color', { ...validConfig, nonAbacBanner: [{ enabled: true, text: 'X' }] }],
		['nonAbacBanner entry with 3-digit color', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, color: '#fff' }] }],
		['unknown nonAbacBanner option', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, position: 'top' }] }],
		['unknown match type', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { type: ['channel'] } }, defaultEntry] }],
		['omnichannel match type', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { type: ['omnichannel'] } }, defaultEntry] }],
		['duplicate match type', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { type: ['direct', 'direct'] } }, defaultEntry] }],
		['unknown match key', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { encrypted: true } }, defaultEntry] }],
		['non-boolean match flag', { ...validConfig, nonAbacBanner: [{ ...defaultEntry, match: { federated: 'yes' } }, defaultEntry] }],
	])('rejects %s', (_name, config) => {
		expect(validate(config)).toBe(false);
	});
});
