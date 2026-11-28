import { normalizeLanguage } from './normalizeLanguage';

describe('normalizeLanguage', () => {
	it('should return empty/falsy language as is', () => {
		expect(normalizeLanguage('')).toBe('');
	});

	it('should normalize lowercase region codes to uppercase', () => {
		expect(normalizeLanguage('pt-br')).toBe('pt-BR');
		expect(normalizeLanguage('en-us')).toBe('en-US');
		expect(normalizeLanguage('de-at')).toBe('de-AT');
	});

	it('should support 3-digit UN M49 region codes', () => {
		expect(normalizeLanguage('es-419')).toBe('es-419');
	});

	it('should normalize script subtags with title casing rather than treating them as region codes', () => {
		expect(normalizeLanguage('sr-latn')).toBe('sr-Latn');
		expect(normalizeLanguage('sr-Latn')).toBe('sr-Latn');
		expect(normalizeLanguage('sr-LATN')).toBe('sr-Latn');
		expect(normalizeLanguage('az-latn')).toBe('az-Latn');
		expect(normalizeLanguage('uz-cyrl')).toBe('uz-Cyrl');
	});

	it('should handle underscore delimiter', () => {
		expect(normalizeLanguage('pt_br')).toBe('pt-BR');
		expect(normalizeLanguage('zh_tw')).toBe('zh-TW');
		expect(normalizeLanguage('zh_hk')).toBe('zh-HK');
		expect(normalizeLanguage('zh_cn')).toBe('zh');
		expect(normalizeLanguage('sr_latn')).toBe('sr-Latn');
	});

	it('should resolve Traditional Chinese variants to zh-TW', () => {
		expect(normalizeLanguage('zh-TW')).toBe('zh-TW');
		expect(normalizeLanguage('zh-tw')).toBe('zh-TW');
		expect(normalizeLanguage('zh-Hant')).toBe('zh-TW');
		expect(normalizeLanguage('zh-hant')).toBe('zh-TW');
		expect(normalizeLanguage('zh-Hant-TW')).toBe('zh-TW');
		expect(normalizeLanguage('zh-hant-tw')).toBe('zh-TW');
		expect(normalizeLanguage('zh-CHT')).toBe('zh-TW');
		expect(normalizeLanguage('zh-cht')).toBe('zh-TW');
	});

	it('should resolve Hong Kong / Macau Traditional Chinese variants to zh-HK', () => {
		expect(normalizeLanguage('zh-HK')).toBe('zh-HK');
		expect(normalizeLanguage('zh-hk')).toBe('zh-HK');
		expect(normalizeLanguage('zh-Hant-HK')).toBe('zh-HK');
		expect(normalizeLanguage('zh-hant-hk')).toBe('zh-HK');
		expect(normalizeLanguage('zh-MO')).toBe('zh-HK');
		expect(normalizeLanguage('zh-mo')).toBe('zh-HK');
		expect(normalizeLanguage('zh-Hant-MO')).toBe('zh-HK');
		expect(normalizeLanguage('zh-hant-mo')).toBe('zh-HK');
	});

	it('should resolve Simplified Chinese variants to zh', () => {
		expect(normalizeLanguage('zh')).toBe('zh');
		expect(normalizeLanguage('zh-CN')).toBe('zh');
		expect(normalizeLanguage('zh-cn')).toBe('zh');
		expect(normalizeLanguage('zh-Hans')).toBe('zh');
		expect(normalizeLanguage('zh-hans')).toBe('zh');
		expect(normalizeLanguage('zh-Hans-CN')).toBe('zh');
		expect(normalizeLanguage('zh-hans-cn')).toBe('zh');
		expect(normalizeLanguage('zh-SG')).toBe('zh');
		expect(normalizeLanguage('zh-CHS')).toBe('zh');
	});

	it('should keep other languages unchanged', () => {
		expect(normalizeLanguage('en')).toBe('en');
		expect(normalizeLanguage('fr')).toBe('fr');
		expect(normalizeLanguage('de')).toBe('de');
		expect(normalizeLanguage('ja')).toBe('ja');
	});
});
