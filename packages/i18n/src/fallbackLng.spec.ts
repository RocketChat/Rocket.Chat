import i18next from 'i18next';

import { defaultFallbackLng } from './index';

describe('defaultFallbackLng', () => {
	it('should resolve zh-TW to [zh-TW, zh-HK, en] without zh / Simplified Chinese', () => {
		const i18n = i18next.createInstance();
		i18n.init({
			lng: 'zh-TW',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
		});

		expect(i18n.languages).toEqual(['zh-TW', 'zh-HK', 'en']);
		expect(i18n.languages).not.toContain('zh');
		expect(i18n.languages).not.toContain('zh-CN');
	});

	it('should resolve zh-HK to [zh-HK, zh-TW, en] without zh / Simplified Chinese', () => {
		const i18n = i18next.createInstance();
		i18n.init({
			lng: 'zh-HK',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
		});

		expect(i18n.languages).toEqual(['zh-HK', 'zh-TW', 'en']);
		expect(i18n.languages).not.toContain('zh');
		expect(i18n.languages).not.toContain('zh-CN');
	});

	it('should resolve zh (Simplified Chinese) to [zh, en]', () => {
		const i18n = i18next.createInstance();
		i18n.init({
			lng: 'zh',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
		});

		expect(i18n.languages).toEqual(['zh', 'en']);
	});

	it('should resolve zh-CN to [zh-CN, zh, en]', () => {
		const i18n = i18next.createInstance();
		i18n.init({
			lng: 'zh-CN',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
		});

		expect(i18n.languages).toEqual(['zh-CN', 'zh', 'en']);
	});

	it('should resolve regional variants like pt-BR and de-AT appropriately', () => {
		const i18nPt = i18next.createInstance();
		i18nPt.init({
			lng: 'pt-BR',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
		});
		expect(i18nPt.languages).toEqual(['pt-BR', 'pt', 'en']);

		const i18nDe = i18next.createInstance();
		i18nDe.init({
			lng: 'de-AT',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
		});
		expect(i18nDe.languages).toEqual(['de-AT', 'de', 'en']);
	});

	it('should resolve translation keys from zh-TW and fall back to en when missing in zh-TW', () => {
		const i18n = i18next.createInstance();
		i18n.init({
			lng: 'zh-TW',
			fallbackLng: defaultFallbackLng,
			load: 'currentOnly',
			initImmediate: false,
			resources: {
				'zh-TW': {
					translation: {
						Users: '使用者',
					},
				},
				'zh': {
					translation: {
						Users: '用户',
						private: '私有',
					},
				},
				'en': {
					translation: {
						Users: 'Users',
						private: 'private',
					},
				},
			},
		});

		// Present in zh-TW
		expect(i18n.t('Users')).toBe('使用者');
		// Missing in zh-TW -> should fall back to en, NOT zh (Simplified Chinese)
		expect(i18n.t('private')).toBe('private');
	});
});
