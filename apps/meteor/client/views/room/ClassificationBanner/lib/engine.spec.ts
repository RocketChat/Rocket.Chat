import { readableTextColor } from './colors';
import { buildClassificationBanner, parseClassificationBannersConfig } from './engine';
import type { ClassificationBannersConfig } from './types';

const config: ClassificationBannersConfig = {
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
				{ source: 'TS-SCI', label: 'TOP SECRET//SCI', color: '#fce100' },
				{ source: 'TS', label: 'TOP SECRET', color: '#ff8c00' },
				{ source: 'S', label: 'SECRET', color: '#c8102e' },
				{ source: 'C', label: 'CONFIDENTIAL', color: '#0033a0' },
				{ source: 'CUI', label: 'CUI', color: '#502b85' },
				{ source: 'U', label: 'UNCLASSIFIED', color: '#007a33' },
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
		expect(banner.color).toBe('#1F2329');
		expect(banner).toMatchObject({ style: 'classic', uppercase: true, monospace: false });
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

	it('picks the most restrictive value color in highest mode (index 0 = highest ranking)', () => {
		const banner = buildClassificationBanner(config, [{ key: 'clearance.level', values: ['U', 'TS'] }]);

		expect(banner.backgroundColor).toBe('#ff8c00');
	});

	it('picks the color of the first room value that is mapped in attribute mode', () => {
		const attributeModeConfig = { ...config, banner: { ...config.banner, colorMode: 'attribute' as const } };

		expect(buildClassificationBanner(attributeModeConfig, [{ key: 'clearance.level', values: ['U', 'TS'] }]).backgroundColor).toBe(
			'#007a33',
		);
		expect(buildClassificationBanner(attributeModeConfig, [{ key: 'clearance.level', values: ['TS', 'U'] }]).backgroundColor).toBe(
			'#ff8c00',
		);
	});

	it('excludes attributes with showInBanner disabled', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['S'] },
			{ key: 'dissem.controls', values: ['NF'] },
		]);

		expect(banner.text).toBe('SECRET');
	});

	it('renders unmapped values of a configured attribute as raw text, after the mapped labels', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['TS'] },
			{ key: 'dissem.relto', values: ['USA', 'ACGU'] },
		]);

		expect(banner.text).toBe('TOP SECRET // RELTO USA/ACGU');
	});

	it('sorts each group alphabetically when sortAlpha is set, keeping unmapped values last, and counts both toward groupThreshold', () => {
		expect(buildClassificationBanner(config, [{ key: 'access.programs', values: ['aaa', 'SAP-3380', 'SAP-1042'] }]).text).toBe(
			'SAR-APPLES/ORANGES/aaa',
		);
		expect(
			buildClassificationBanner(config, [{ key: 'access.programs', values: ['SAP-1042', 'SAP-2271', 'SAP-3380', 'cherry'] }]).text,
		).toBe('SAR-MULTIPLE PROGRAMS');
	});

	it('does not let unmapped values drive the color', () => {
		const banner = buildClassificationBanner(config, [
			{ key: 'clearance.level', values: ['X'] },
			{ key: 'dissem.relto', values: ['USA'] },
		]);

		expect(banner.text).toBe('X // RELTO USA');
		expect(banner.backgroundColor).toBe('#6C727A');
	});

	it('renders the fallback banner when the room only carries attributes not present in the config', () => {
		const banner = buildClassificationBanner(config, [{ key: 'country', values: ['USA'] }]);

		expect(banner).toMatchObject({
			text: 'NO CLASSIFICATION DATA',
			segments: [],
			backgroundColor: '#6C727A',
			color: '#FFFFFF',
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

	it('picks the higher-contrast ink on mid-range backgrounds', () => {
		expect(readableTextColor('#999999')).toBe('#1F2329');
	});
});

describe('parseClassificationBannersConfig', () => {
	it('parses a valid config', () => {
		expect(parseClassificationBannersConfig(JSON.stringify(config))).toEqual(config);
	});

	it.each([
		['empty string (unset setting)', ''],
		['invalid JSON', 'not json'],
	])('returns null for %s', (_name, raw) => {
		expect(parseClassificationBannersConfig(raw)).toBeNull();
	});
});
