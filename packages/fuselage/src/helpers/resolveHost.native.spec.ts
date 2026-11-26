import { resolveHost as resolveWebHost, resolveTextHost as resolveWebTextHost } from './resolveHost';
import { resolveHost, resolveTextHost } from './resolveHost.native';

jest.mock('react-native', () => ({ Image: 'RNImage', Text: 'RNText', TextInput: 'RNTextInput', View: 'RNView' }), { virtual: true });

describe('resolveHost on native', () => {
	it.each(['span', 'p', 'h1', 'h6', 'label', 'strong', 'em', 'small', 'a', 'code', 'time'] as const)('renders <%s> as Text', (tag) => {
		expect(resolveHost(tag)).toBe('RNText');
	});

	it.each(['input', 'textarea'] as const)('renders <%s> as TextInput', (tag) => {
		expect(resolveHost(tag)).toBe('RNTextInput');
	});

	it('renders <img> as Image', () => {
		expect(resolveHost('img')).toBe('RNImage');
	});

	it.each(['div', 'section', 'ul', 'li', 'header', 'button'] as const)('renders <%s> as View', (tag) => {
		expect(resolveHost(tag)).toBe('RNView');
	});

	it('returns a component as it is', () => {
		const Component = () => null;
		expect(resolveHost(Component)).toBe(Component);
		expect(resolveTextHost(Component)).toBe(Component);
	});

	it('renders any text tag as Text', () => {
		expect(resolveTextHost('li')).toBe('RNText');
		expect(resolveTextHost('div')).toBe('RNText');
	});
});

describe('resolveHost on web', () => {
	it('returns the tag name unchanged', () => {
		expect(resolveWebHost('div')).toBe('div');
		expect(resolveWebTextHost('li')).toBe('li');
	});
});
