import { parse } from '@rocket.chat/message-parser';

import { inlineBigEmoji } from './inlineBigEmoji';

it('parses emoji-only text as a big emoji block', () => {
	expect(parse('😀', { emoticons: false })[0].type).toBe('BIG_EMOJI');
});

it('turns a big emoji block into a paragraph of emoji', () => {
	const [token] = inlineBigEmoji(parse('😀 :smile:', { emoticons: false }));

	expect(token.type).toBe('PARAGRAPH');
	expect((token as { value: { type: string }[] }).value.map(({ type }) => type)).toEqual(['EMOJI', 'EMOJI']);
});

it('leaves other blocks untouched', () => {
	const tokens = parse('hello 😀', { emoticons: false });

	expect(inlineBigEmoji(tokens)).toEqual(tokens);
});
