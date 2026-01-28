import { parse } from '../src';
import { bold, italic, paragraph, plain, spoiler, strike } from '../src/utils';

test.each([
	['||spoiler||', [paragraph([spoiler([plain('spoiler')])])]],
	['||spoiler **bold**||', [paragraph([spoiler([plain('spoiler '), bold([plain('bold')])])])]],
	['||__i__ ~~s~~||', [paragraph([spoiler([italic([plain('i')]), plain(' '), strike([plain('s')])])])]],
	['||unclosed', [paragraph([plain('||unclosed')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
});
