import { plain, emoji, reducePlainTexts } from '../src/utils';

describe('joinEmoji behavior through reducePlainTexts', () => {
	it('keeps emoji when alone', () => {
		const result = reducePlainTexts([emoji('smile')]);
		expect(result[0].type).toBe('EMOJI');
	});

	it('merges consecutive plain texts', () => {
		const result = reducePlainTexts([plain('hello '), plain('world')]);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'PLAIN_TEXT', value: 'hello world' });
	});

	it('converts emoji with plain text neighbors to shortCode and merges', () => {
		const result = reducePlainTexts([plain('hello'), emoji('smile'), plain('world')]);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			type: 'PLAIN_TEXT',
			value: 'hello:smile:world',
		});
	});
});
