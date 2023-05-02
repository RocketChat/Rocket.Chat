import fs from 'fs';

import { jest } from '@jest/globals';

describe('i18n', () => {
	let normalizeI18nInterpolations;

	beforeEach(async () => {
		jest.spyOn(fs, 'readdirSync').mockReturnValue(['en.i18n.json']);
		jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
		jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify({}));
	});

	afterEach(() => {
		jest.resetModules();
	});

	describe('normalizeI18nInterpolations', () => {
		it('should throw an error if the language is not supported', async () => {
			const i18n = await import('./index.mjs');
			normalizeI18nInterpolations = i18n.normalizeI18nInterpolations;
			jest.spyOn(fs, 'readdirSync').mockReturnValue(['en.i18n.json']);
			expect(() => normalizeI18nInterpolations({}, 'fr')).toThrow('Language not supported');
		});

		it('should return the same object if there are no interpolations', async () => {
			const i18n = await import('./index.mjs');
			normalizeI18nInterpolations = i18n.normalizeI18nInterpolations;
			const fileContents = { test: 'test' };
			expect(normalizeI18nInterpolations(fileContents, 'en')).toEqual(fileContents);
		});

		it('should return the replace the interpolation(__) keys to the desired one ({{}})', async () => {
			const i18n = await import('./index.mjs');
			normalizeI18nInterpolations = i18n.normalizeI18nInterpolations;
			const fileContents = {
				shouldChange: 'this is the __key__',
				shouldNotChange: 'normal one',
				multipleKeys: 'sentence __with__ multiple __keys__',
			};
			expect(normalizeI18nInterpolations(fileContents, 'en')).toEqual({
				shouldChange: 'this is the {{key}}',
				shouldNotChange: 'normal one',
				multipleKeys: 'sentence {{with}} multiple {{keys}}',
			});
		});

		it('should write a txt file with the collected statistics', async () => {
			jest.spyOn(fs, 'readFileSync').mockImplementation(() =>
				JSON.stringify({
					shouldChange: 'this is the __key__',
					shouldNotChange: 'normal one',
					multipleKeys: 'sentence __with__ multiple __keys__',
					withSprintf: 'this is the %s',
					withNullValues: null,
					withI18NextComponentsArray: 'this is the <0>key</0> <1>key2</1>',
				}),
			);
			jest.spyOn(fs, 'writeFileSync').mockImplementation((path, content) => {
				if (path === './dist/stats.txt') {
					expect(content.replace(/\s/g, '')).toEqual(
						`Number of keys using __ and replaced by native i18next interpolation('{{' '}}') key: 2 keys
						Number of keys with (explicit) null values: 1 keys
						Number of keys using sprintf: 1 keys
						Number of keys using i18next components array (<number></number>): 1 keys
			
						(explicit) null values: [
							{
							"language": "en",
							"key": "withNullValues"
							}
						]
						==================================================
						__ : [
							{
							"language": "en",
							"key": "shouldChange"
							},
							{
							"language": "en",
							"key": "multipleKeys"
							}
						]`.replace(/\s/g, ''),
					);
				}
			});
			await import('./index.mjs');
		});
	});
});
