import { render } from '@testing-library/react';

import { loadStories } from './loadStories';

// A text node under a Tamagui `View` throws on React Native and is invisible on the web, so every story is rendered in
// development mode and the console is checked for the warnings React and Tamagui print for it.
const TEXT_NODE_WARNING =
	/text node cannot be a child of a <View>|Text strings must be rendered within a <Text>|Unexpected text node|Text node .* cannot be a child/i;

describe('[Text nodes in stories]', () => {
	it('recognises the warnings it looks for', () => {
		expect(TEXT_NODE_WARNING.test('Unexpected text node: foo. A text node cannot be a child of a <View>.')).toBe(true);
		expect(TEXT_NODE_WARNING.test('Warning: Each child in a list should have a unique "key" prop.')).toBe(false);
	});

	test.each(loadStories().map(({ title, Story }) => [title, Story] as const))('%s renders no text node under a View', (_title, Story) => {
		// Development mode makes unrelated libraries chatty too, which is not printed here
		const spies = [jest.spyOn(console, 'error'), jest.spyOn(console, 'warn')].map((spy) => spy.mockImplementation(() => undefined));
		const before = spies.map((spy) => spy.mock.calls.length);

		// Tamagui prints the warning only when NODE_ENV is "development" at render time, and jest runs with "test"
		const { NODE_ENV } = process.env;
		process.env.NODE_ENV = 'development';
		try {
			render(<Story />);
		} finally {
			process.env.NODE_ENV = NODE_ENV;
		}

		const messages = spies.flatMap((spy, index) => spy.mock.calls.slice(before[index]).map((args) => args.join(' ')));
		// Other warnings are not this spec's concern
		spies.forEach((spy) => spy.mockClear());
		expect(messages.filter((message) => TEXT_NODE_WARNING.test(message))).toEqual([]);
	});
});
