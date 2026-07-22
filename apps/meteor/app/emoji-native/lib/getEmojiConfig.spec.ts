import { getEmojiConfig } from './getEmojiConfig';
import type { EmojiPackages } from '../../emoji/lib/rocketchat';

const buildEmojiPackages = (ascii: boolean): EmojiPackages =>
	({
		packages: { native: { ascii } },
		list: {},
	}) as unknown as EmojiPackages;

describe('native emoji render', () => {
	it('converts ascii emoticons when the ascii flag is enabled', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(true));

		expect(render('hello :)')).toBe('hello <span class="emoji" title=":)">🙂</span>');
	});

	it('converts HTML-escaped ascii emoticons', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(true));

		expect(render('hello &gt;:(')).toBe('hello <span class="emoji" title="&gt;:(">😠</span>');
		expect(render('hello &lt;3')).toBe('hello <span class="emoji" title="&lt;3">❤</span>');
	});

	it('keeps ascii emoticons literal when the ascii flag is disabled', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(false));

		expect(render('hello :)')).toBe('hello :)');
	});

	it('converts ascii emoticons adjacent to HTML tags', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(true));

		expect(render('<p>hello :D</p>')).toBe('<p>hello <span class="emoji" title=":D">😄</span></p>');
		expect(render('<p>:)</p>')).toBe('<p><span class="emoji" title=":)">🙂</span></p>');
	});

	it('does not convert ascii sequences inside words or URLs', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(true));

		expect(render('https://rocket.chat')).toBe('https://rocket.chat');
		expect(render('hello:)')).toBe('hello:)');
	});

	it('does not convert ascii sequences inside HTML tags', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(true));

		expect(render('<a href="https://rocket.chat">rocket</a>')).toBe('<a href="https://rocket.chat">rocket</a>');
	});

	it('still renders shortcodes when the ascii flag is enabled', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(true));

		expect(render(':smiley:')).toContain('<span class="emoji" title=":smiley:">');
	});
});
