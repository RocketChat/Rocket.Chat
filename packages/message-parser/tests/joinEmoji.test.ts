import { plain, emoji, reducePlainTexts } from '../src/utils';

describe('joinEmoji behavior through reducePlainTexts', () => {
	it('keeps emoji when alone', () => {
		const result = reducePlainTexts([emoji('smile')]);
		expect(result[0].type).toBe('EMOJI');
	});

	it('merges consecutive plain texts', () => {
		const result = reducePlainTexts([
			plain('hello '),
			plain('world')
		]);

		expect(result[0].value).toBe('hello world');
	});

	it('handles emoji between plain texts', () => {
		const result = reducePlainTexts([
			plain('hello'),
			emoji('smile'),
			plain('world')
		]);

		expect(result.length).toBeGreaterThan(0);
	});
});