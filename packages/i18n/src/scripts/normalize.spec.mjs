import { normalizeI18nInterpolations } from './normalize.mjs';

describe('normalizeI18nInterpolations', () => {
	it('should return the same object if there are no interpolations', async () => {
		const fileContents = { test: 'test' };

		expect(normalizeI18nInterpolations(fileContents, 'en')).toEqual(fileContents);
	});

	it('should return the replace the interpolation(__) keys to the desired one ({{}})', async () => {
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
});
