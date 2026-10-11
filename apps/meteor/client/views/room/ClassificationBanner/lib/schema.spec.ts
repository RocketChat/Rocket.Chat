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

const { banner } = validConfig;
const [attribute] = validConfig.attributes;
const [value] = attribute.values;

describe('classification banners JSON schema (v1 enforcement contract)', () => {
	it('accepts a complete document typed as ClassificationBannersConfig', () => {
		expect(validate(validConfig)).toBe(true);
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
	])('rejects %s', (_name, config) => {
		expect(validate(config)).toBe(false);
	});
});
