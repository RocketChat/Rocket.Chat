import { parse } from '../src';
import { paragraph, plain, mentionUser, mentionChannel } from '../src/utils';

test.each([
  ['@guilherme.gazzo', [paragraph([mentionUser('guilherme.gazzo')])]],
  [
    '@guilherme.gazzo. ',
    [paragraph([mentionUser('guilherme.gazzo.'), plain(' ')])],
  ],
  ['#GENERAL', [paragraph([mentionChannel('GENERAL')])]],
  ['@user:server.com', [paragraph([mentionUser('user:server.com')])]],
  [
    '@marcos.defendi:matrix.org',
    [paragraph([mentionUser('marcos.defendi:matrix.org')])],
  ],
  ['@username@example.com', [paragraph([mentionUser('username@example.com')])]],
  [
    '@099fnd2ee@example.com',
    [paragraph([mentionUser('099fnd2ee@example.com')])],
  ],
  ['@téstãçâò', [paragraph([mentionUser('téstãçâò')])]],
  ['@สมชาย', [paragraph([mentionUser('สมชาย')])]],
  ['@李祖阳', [paragraph([mentionUser('李祖阳')])]],
  ['@あおい', [paragraph([mentionUser('あおい')])]],
  ['@アオイ', [paragraph([mentionUser('アオイ')])]],
  ['@Владимир', [paragraph([mentionUser('Владимир')])]],
  ['@Кириллица', [paragraph([mentionUser('Кириллица')])]],
  [
    'test @Кириллица test',
    [paragraph([plain('test '), mentionUser('Кириллица'), plain(' test')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
