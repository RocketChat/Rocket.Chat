import { emojiParser } from './emojiParser';
import { emoji } from './lib';
import { getEmojiConfig } from '../../../app/emoji-native/lib/getEmojiConfig';

beforeAll(() => {
	emoji.packages.native = { render: getEmojiConfig(emoji).render } as (typeof emoji.packages)[string];
});

const renderedEmojis = (html: string) => {
	const holder = document.createElement('div');
	holder.innerHTML = html;
	return Array.from(holder.querySelectorAll('.emoji')).map((element) => element.classList.contains('big'));
};

describe('emojiParser', () => {
	it('renders every emoji big when the message holds nothing else', () => {
		expect(renderedEmojis(emojiParser(':smile: :grinning:'))).toEqual([true, true]);
	});

	it('keeps emojis at their regular size when the message also holds text', () => {
		expect(renderedEmojis(emojiParser('hello :smile:'))).toEqual([false]);
	});
});
