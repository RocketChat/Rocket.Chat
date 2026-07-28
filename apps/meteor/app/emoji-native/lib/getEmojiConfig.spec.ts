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

	it('renders bare (non-VS16) emoji-default characters', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(false));

		expect(render('🐕')).toBe('<span class="emoji" title=":dog2:">🐕</span>');
		expect(render('🐶')).toBe('<span class="emoji" title=":dog:">🐶</span>');
		expect(render('⭐')).toBe('<span class="emoji" title=":star:">⭐</span>');
		expect(render('👍')).toBe('<span class="emoji" title=":thumbsup:">👍</span>');
	});

	it('resolves the VS16-qualified form to the same shortcode', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(false));

		expect(render('🐕\u{FE0F}')).toBe('<span class="emoji" title=":dog2:">🐕\u{FE0F}</span>');
		expect(render('⭐\u{FE0F}')).toBe('<span class="emoji" title=":star:">⭐\u{FE0F}</span>');
	});

	it('only treats text-default symbols as emoji when VS16 is present', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(false));

		expect(render('©')).toBe('©');
		expect(render('™')).toBe('™');
		expect(render('©\u{FE0F}')).toBe('<span class="emoji" title=":copyright:">©\u{FE0F}</span>');
	});

	it('renders shortcodes contested with emojibase using their emojione meaning', () => {
		const { render } = getEmojiConfig(buildEmojiPackages(false));

		expect(render(':up:')).toBe('<span class="emoji" title=":up:">🆙</span>');
		expect(render(':arrow_up_small:')).toBe('<span class="emoji" title=":arrow_up_small:">🔼</span>');
		expect(render(':cat:')).toBe('<span class="emoji" title=":cat:">🐱</span>');
		expect(render(':cat2:')).toBe('<span class="emoji" title=":cat2:">🐈️</span>');
	});

	it('renders picker entries for contested shortcodes', () => {
		const { renderPicker } = getEmojiConfig(buildEmojiPackages(false));

		expect(renderPicker(':up:')).toBe('<span class="emoji" title=":up:">🆙</span>');
		expect(renderPicker(':cat2:')).toBe('<span class="emoji" title=":cat2:">🐈️</span>');
	});
});
