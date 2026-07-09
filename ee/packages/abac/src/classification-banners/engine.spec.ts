import { buildClassificationBanner, parseClassificationBannersConfig, readableTextColor } from './engine';
import type { ClassificationBannersConfig } from './types';

const config: ClassificationBannersConfig = {
	version: 1,
	enabled: true,
	source: 'idp',
	banner: {
		style: 'classic',
		position: 'top',
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
				{ source: 'U', label: 'UNCLASSIFIED', color: '#007a33' },
				{ source: 'CUI', label: 'CUI', color: '#502b85' },
				{ source: 'C', label: 'CONFIDENTIAL', color: '#0033a0' },
				{ source: 'S', label: 'SECRET', color: '#c8102e' },
				{ source: 'TS', label: 'TOP SECRET', color: '#ff8c00' },
				{ source: 'TS-SCI', label: 'TOP SECRET//SCI', color: '#fce100' },
			],
		},
		{
			id: 'sar',
			source: 'access.programs',
			label: 'Special access programs',
			showInBanner: true,
			showLabel: true,
			bannerLabel: 'SAR',
			labelSeparator: '-',
			valueSeparator: '/',
			sortAlpha: true,
			groupThreshold: 4,
			multipleLabel: 'MULTIPLE PROGRAMS',
			drivesColor: false,
			values: [
				{ source: 'SAP-1042', label: 'APPLES', color: '#c8102e' },
				{ source: 'SAP-2271', label: 'BANANAS', color: '#ff8c00' },
				{ source: 'SAP-3380', label: 'ORANGES', color: '#0033a0' },
				{ source: 'SAP-4419', label: 'PEACHES', color: '#007a33' },
				{ source: 'SAP-5567', label: 'GRAPES', color: '#502b85' },
			],
		},
		{
			id: 'relto',
			source: 'dissem.relto',
			label: 'Releasable to',
			showInBanner: true,
			showLabel: true,
			bannerLabel: 'RELTO',
			labelSeparator: ' ',
			valueSeparator: '/',
			sortAlpha: false,
			groupThreshold: 0,
			multipleLabel: '',
			drivesColor: false,
			values: [
				{ source: 'USA', label: 'USA', color: '#0033a0' },
				{ source: 'FVEY', label: 'FVEY', color: '#007a33' },
				{ source: 'NATO', label: 'NATO', color: '#502b85' },
			],
		},
		{
			id: 'dissem',
			source: 'dissem.controls',
			label: 'Dissemination controls',
			showInBanner: false,
			showLabel: false,
			bannerLabel: '',
			labelSeparator: '',
			valueSeparator: '/',
			sortAlpha: true,
			groupThreshold: 0,
			multipleLabel: '',
			drivesColor: false,
			values: [
				{ source: 'NF', label: 'NOFORN', color: '#c8102e' },
				{ source: 'OC', label: 'ORCON', color: '#ff8c00' },
				{ source: 'IM', label: 'IMCON', color: '#0033a0' },
			],
		},
	],
};

describe('buildClassificationBanner', () => {
	it('assembles the default prototype output', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['TS'] },
			{ key: 'access.programs', values: ['SAP-1042', 'SAP-2271', 'SAP-3380'] },
			{ key: 'dissem.relto', values: ['USA'] },
		]);

		expect(banner.text).toBe('TOP SECRET // SAR-APPLES/BANANAS/ORANGES // RELTO USA');
		expect(banner.segments.map((s) => s.attrId)).toEqual(['classification', 'sar', 'relto']);
		expect(banner.backgroundColor).toBe('#ff8c00');
		expect(banner.color).toBe('#FFFFFF');
		expect(banner.fallback).toBe(false);
		expect(banner).toMatchObject({ style: 'classic', position: 'top', uppercase: true, monospace: false });
	});

	it('collapses to multipleLabel when value count reaches groupThreshold', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['TS'] },
			{ key: 'access.programs', values: ['SAP-1042', 'SAP-2271', 'SAP-3380', 'SAP-4419', 'SAP-5567'] },
		]);

		expect(banner.text).toBe('TOP SECRET // SAR-MULTIPLE PROGRAMS');
	});

	it('does not collapse below groupThreshold and sorts labels alphabetically when sortAlpha is set', () => {
		const banner = buildClassificationBanner(config, [{ key: 'access.programs', values: ['SAP-3380', 'SAP-1042'] }]);

		expect(banner.text).toBe('SAR-APPLES/ORANGES');
	});

	it('picks the most restrictive value color in highest mode', () => {
		const banner = buildClassificationBanner(config, [{ key: 'clearance.level', values: ['U', 'TS'] }]);

		expect(banner.backgroundColor).toBe('#ff8c00');
	});

	it('picks the first selected value color in attribute mode', () => {
		const attributeModeConfig = { ...config, banner: { ...config.banner, colorMode: 'attribute' as const } };
		const banner = buildClassificationBanner(attributeModeConfig, [{ key: 'clearance.level', values: ['U', 'TS'] }]);

		expect(banner.backgroundColor).toBe('#007a33');
	});

	it('excludes attributes with showInBanner disabled', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['S'] },
			{ key: 'dissem.controls', values: ['NF'] },
		]);

		expect(banner.text).toBe('SECRET');
	});

	it('ignores room values not covered by the config and uses the fallback color when the driver has no match', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['X'] },
			{ key: 'dissem.relto', values: ['USA'] },
		]);

		expect(banner.text).toBe('RELTO USA');
		expect(banner.backgroundColor).toBe('#6C727A');
		expect(banner.fallback).toBe(false);
	});

	it('renders the fallback banner when nothing matches', () => {
		const banner = buildClassificationBanner(config, [{ key: 'clearance.level', values: ['X'] }]);

		expect(banner).toMatchObject({
			text: 'NO CLASSIFICATION DATA',
			segments: [],
			backgroundColor: '#6C727A',
			color: '#FFFFFF',
			fallback: true,
		});
	});

	it('applies engine defaults for omitted banner options', () => {
		const minimal: ClassificationBannersConfig = {
			version: 1,
			enabled: true,
			banner: { delimiter: ' // ' },
			attributes: [config.attributes[0]],
		};
		const banner = buildClassificationBanner(minimal, []);

		expect(banner).toMatchObject({
			style: 'classic',
			position: 'top',
			uppercase: true,
			monospace: false,
			text: 'NO CLASSIFICATION DATA',
			backgroundColor: '#6C727A',
			fallback: true,
		});
	});
});

describe('readableTextColor', () => {
	it('uses dark text over light backgrounds and white text over dark backgrounds', () => {
		expect(readableTextColor('#fce100')).toBe('#1F2329');
		expect(readableTextColor('#FFFFFF')).toBe('#1F2329');
		expect(readableTextColor('#c8102e')).toBe('#FFFFFF');
		expect(readableTextColor('#0033a0')).toBe('#FFFFFF');
	});
});

describe('parseClassificationBannersConfig', () => {
	it('parses a valid config', () => {
		expect(parseClassificationBannersConfig(JSON.stringify(config))).toEqual(config);
	});

	it.each([
		['empty string', ''],
		['invalid JSON', 'not json'],
		['non-object', '"str"'],
		['missing everything', '{}'],
		['wrong version', JSON.stringify({ ...config, version: 2 })],
		['missing delimiter', JSON.stringify({ ...config, banner: {} })],
		['empty attributes', JSON.stringify({ ...config, attributes: [] })],
		['malformed attribute', JSON.stringify({ ...config, attributes: [{ id: 'x' }] })],
	])('returns null for %s', (_name, raw) => {
		expect(parseClassificationBannersConfig(raw)).toBeNull();
	});
});
