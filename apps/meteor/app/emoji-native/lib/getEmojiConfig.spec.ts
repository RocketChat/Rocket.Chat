import { getEmojiConfig, setConvertAsciiEmoji } from './getEmojiConfig';
import type { EmojiPackages } from '../../emoji/lib/rocketchat';

const { render } = getEmojiConfig({ packages: {}, list: {} } as unknown as EmojiPackages);

describe('native emoji render', () => {
	beforeEach(() => {
		setConvertAsciiEmoji(true);
	});

	it('converts ascii emoticons when the preference is enabled', () => {
		expect(render('hello :)')).toBe('hello <span class="emoji" title=":)">🙂</span>');
	});

	it('converts HTML-escaped ascii emoticons', () => {
		expect(render('hello &gt;:(')).toBe('hello <span class="emoji" title="&gt;:(">😠</span>');
		expect(render('hello &lt;3')).toBe('hello <span class="emoji" title="&lt;3">❤</span>');
	});

	it('keeps ascii emoticons literal when the preference is disabled', () => {
		setConvertAsciiEmoji(false);

		expect(render('hello :)')).toBe('hello :)');
	});

	it('converts ascii emoticons adjacent to HTML tags', () => {
		expect(render('<p>hello :D</p>')).toBe('<p>hello <span class="emoji" title=":D">😄</span></p>');
		expect(render('<p>:)</p>')).toBe('<p><span class="emoji" title=":)">🙂</span></p>');
	});

	it('does not convert ascii sequences inside words or URLs', () => {
		expect(render('https://rocket.chat')).toBe('https://rocket.chat');
		expect(render('hello:)')).toBe('hello:)');
	});

	it('does not convert ascii sequences inside HTML tags', () => {
		expect(render('<a href="https://rocket.chat">rocket</a>')).toBe('<a href="https://rocket.chat">rocket</a>');
	});

	it('still renders shortcodes when the preference is enabled', () => {
		expect(render(':smiley:')).toContain('<span class="emoji" title=":smiley:">');
	});
});
