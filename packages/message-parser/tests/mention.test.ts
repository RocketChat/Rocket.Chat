import { parse } from '../src';
import { paragraph, plain, mentionUser, mentionChannel } from './helpers';

test.each([
	['@guilherme.gazzo', [paragraph([mentionUser('guilherme.gazzo')])]],
	['@guilherme.gazzo. ', [paragraph([mentionUser('guilherme.gazzo.'), plain(' ')])]],
	['#GENERAL', [paragraph([mentionChannel('GENERAL')])]],
	['@user:server.com', [paragraph([mentionUser('user:server.com')])]],
	['@marcos.defendi:matrix.org', [paragraph([mentionUser('marcos.defendi:matrix.org')])]],
	['@username@example.com', [paragraph([mentionUser('username@example.com')])]],
	['@099fnd2ee@example.com', [paragraph([mentionUser('099fnd2ee@example.com')])]],
	['@téstãçâò', [paragraph([mentionUser('téstãçâò')])]],
	['@สมชาย', [paragraph([mentionUser('สมชาย')])]],
	['@李祖阳', [paragraph([mentionUser('李祖阳')])]],
	['@あおい', [paragraph([mentionUser('あおい')])]],
	['@アオイ', [paragraph([mentionUser('アオイ')])]],
	['@Владимир', [paragraph([mentionUser('Владимир')])]],
	['@Кириллица', [paragraph([mentionUser('Кириллица')])]],
	['test @Кириллица test', [paragraph([plain('test '), mentionUser('Кириллица'), plain(' test')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});

describe('a # inside a word', () => {
	test.each([
		['x#general', [paragraph([plain('x#general')])]],
		['x#general.com', [paragraph([plain('x#general.com')])]],
		['file#v2.pdf', [paragraph([plain('file#v2.pdf')])]],
		['x#foo#bar', [paragraph([plain('x#foo#bar')])]],
		['x#team@alice', [paragraph([plain('x#team@alice')])]],
		['x#team+15551234567', [paragraph([plain('x#team+15551234567')])]],
		['"#team.dev"', [paragraph([plain('"#team.dev"')])]],
		['see #general.com', [paragraph([plain('see '), mentionChannel('general.com')])]],
	])('parses %p', (input, output) => {
		expect(parse(input)).toEqual(output);
	});
});
