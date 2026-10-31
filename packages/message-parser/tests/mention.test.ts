import { parse } from '../src';
import { paragraph, plain, mentionUser, mentionChannel } from './helpers';

test.each([
	['@guilherme.gazzo', [paragraph([mentionUser('guilherme.gazzo')])]],
	['@guilherme.gazzo. ', [paragraph([mentionUser('guilherme.gazzo'), plain('. ')])]],
	['thanks @john.', [paragraph([plain('thanks '), mentionUser('john'), plain('.')])]],
	['@john...', [paragraph([mentionUser('john'), plain('...')])]],
	['@user:server.com.', [paragraph([mentionUser('user:server.com'), plain('.')])]],
	['@username@example.com.', [paragraph([mentionUser('username@example.com'), plain('.')])]],
	['@john_', [paragraph([mentionUser('john_')])]],
	['see #general.', [paragraph([plain('see '), mentionChannel('general'), plain('.')])]],
	['#a.b.', [paragraph([mentionChannel('a.b'), plain('.')])]],
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
