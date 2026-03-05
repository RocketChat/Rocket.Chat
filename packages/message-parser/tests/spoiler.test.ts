import { parse } from '../src';
import { bold, emoji, italic, link, mentionChannel, mentionUser, paragraph, plain, spoiler, strike } from './helpers';

describe('spoiler parsing', () => {
	test.each([
		['||spoiler||', [paragraph([spoiler([plain('spoiler')])])]],
		['||spoiler **bold**||', [paragraph([spoiler([plain('spoiler '), bold([plain('bold')])])])]],
		['||__i__ ~~s~~||', [paragraph([spoiler([italic([plain('i')]), plain(' '), strike([plain('s')])])])]],
		['||unclosed', [paragraph([plain('||unclosed')])]],
	])('parses basic spoilers: %p', (input, output) => {
		expect(parse(input)).toMatchObject(output);
	});

	test.each([
		// Nested markup
		['||**bold __italic__**||', [paragraph([spoiler([bold([plain('bold '), italic([plain('italic')])])])])]],
		['||~~**strike bold**~~||', [paragraph([spoiler([strike([bold([plain('strike bold')])])])])]],

		// With mentions
		['||@user mention||', [paragraph([spoiler([mentionUser('user'), plain(' mention')])])]],
		['||#channel mention||', [paragraph([spoiler([mentionChannel('channel'), plain(' mention')])])]],

		// With links
		['||[link text](https://example.com)||', [paragraph([spoiler([link('https://example.com', [plain('link text')])])])]],

		// With emoji
		['||text :emoji: text||', [paragraph([spoiler([plain('text '), emoji('emoji'), plain(' text')])])]],

		// Empty spoiler
		['||||', [paragraph([plain('||||')])]],

		// Multiple spoilers in text
		['||first|| and ||second||', [paragraph([spoiler([plain('first')]), plain(' and '), spoiler([plain('second')])])]],

		// Spoiler with special characters
		['||special: !@#$%^&*()||', [paragraph([spoiler([plain('special: !@#$%^&*()')])])]],

		// Unclosed spoilers should be treated as plain text
		['||unclosed spoiler', [paragraph([plain('||unclosed spoiler')])]],
		['text ||unclosed', [paragraph([plain('text ||unclosed')])]],

		// Single pipe should not be treated as spoiler
		['|single pipe|', [paragraph([plain('|single pipe|')])]],

		// Spoiler at start and end
		['||start|| middle ||end||', [paragraph([spoiler([plain('start')]), plain(' middle '), spoiler([plain('end')])])]],
	])('parses edge cases: %p', (input, output) => {
		expect(parse(input)).toMatchObject(output);
	});
});
