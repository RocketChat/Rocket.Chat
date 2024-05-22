import { parse } from '../src';
import {
  link,
  paragraph,
  plain,
  bold,
  strike,
  italic,
  quote,
  lineBreak,
  unorderedList,
  listItem,
  orderedList,
} from '../src/utils';

test.each([
  [
    '<https://domain.com|Test>',
    [paragraph([link('https://domain.com', [plain('Test')])])],
  ],

  [
    `<https://domain.com|Test
>`,
    [paragraph([plain('<https://domain.com|Test')]), paragraph([plain('>')])],
  ],
  [
    `<https://domain.com|Test
> quote here`,
    [
      paragraph([plain('<https://domain.com|Test')]),
      quote([paragraph([plain('quote here')])]),
    ],
  ],
  [
    '[Link](https://domain.com/link?a=%28node_filesystem_avail_bytes%29)',
    [
      paragraph([
        link('https://domain.com/link?a=%28node_filesystem_avail_bytes%29', [
          plain('Link'),
        ]),
      ]),
    ],
  ],
  ['[](https://rocket.chat)', [paragraph([link('https://rocket.chat')])]],
  [
    '[ ](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [plain(' ')])])],
  ],

  [
    '[ test](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [plain(' test')])])],
  ],
  [
    '[ test ](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [plain(' test ')])])],
  ],
  [
    '[title](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [plain('title')])])],
  ],
  [
    '[title](http://localhost)',
    [paragraph([link('http://localhost', [plain('title')])])],
  ],
  [
    '[title](http://localhost?testing=true)',
    [paragraph([link('http://localhost?testing=true', [plain('title')])])],
  ],
  [
    '[**title**](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [bold([plain('title')])])])],
  ],
  [
    '[~~title~~](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [strike([plain('title')])])])],
  ],
  [
    '[__title__](https://rocket.chat)',
    [paragraph([link('https://rocket.chat', [italic([plain('title')])])])],
  ],
  [
    '[__**~~title~~**__](https://rocket.chat)',
    [
      paragraph([
        link('https://rocket.chat', [
          italic([bold([strike([plain('title')])])]),
        ]),
      ]),
    ],
  ],
  [
    'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351'
        ),
      ]),
    ],
  ],
  [
    '<https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351|Test>',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [plain('Test')]
        ),
      ]),
    ],
  ],
  [
    '[title](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [plain('title')]
        ),
      ]),
    ],
  ],
  [
    '[**title**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [bold([plain('title')])]
        ),
      ]),
    ],
  ],
  [
    '[~~title~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [strike([plain('title')])]
        ),
      ]),
    ],
  ],
  [
    '[__title__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [italic([plain('title')])]
        ),
      ]),
    ],
  ],
  [
    '[__**~~title~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [italic([bold([strike([plain('title')])])])]
        ),
      ]),
    ],
  ],
  [
    '[title](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351?query=test12-34)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351?query=test12-34',
          [plain('title')]
        ),
      ]),
    ],
  ],
  [
    '[title](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do?query=test12-34#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do?query=test12-34#Cases/dv/413244000073043351',
          [plain('title')]
        ),
      ]),
    ],
  ],
  [
    '[title](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351?query=test12-34&query2=abc123)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351?query=test12-34&query2=abc123',
          [plain('title')]
        ),
      ]),
    ],
  ],
  [
    '[title](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases?query=test12-34&query2=abcd!e/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases?query=test12-34&query2=abcd!e/dv/413244000073043351',
          [plain('title')]
        ),
      ]),
    ],
  ],
  [
    '[title](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351?query=test12-34&query2=abcd!~-._%2B+)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351?query=test12-34&query2=abcd!~-._%2B+',
          [plain('title')]
        ),
      ]),
    ],
  ],
  ['google.com', [paragraph([link('//google.com', [plain('google.com')])])]],
  [
    'www.google.com',
    [paragraph([link('//www.google.com', [plain('www.google.com')])])],
  ],
  ['rocket.chat:8080', [paragraph([link('rocket.chat:8080')])]],
  ['ShouldNotBeALink', [paragraph([plain('ShouldNotBeALink')])]],
  [
    'http:/ google.com',
    [
      paragraph([
        plain('http:/ '),
        link('//google.com', [plain('google.com')]),
      ]),
    ],
  ],
  [
    '[custom](custom://google.com)',
    [paragraph([link('custom://google.com', [plain('custom')])])],
  ],
  [
    '[thing](https://www.thingiverse.com/thing:5451684)',
    [
      paragraph([
        link('https://www.thingiverse.com/thing:5451684', [plain('thing')]),
      ]),
    ],
  ],
  [
    'https://t.me/joinchat/chatexample',
    [paragraph([link('https://t.me/joinchat/chatexample')])],
  ],
  [
    '[telegram invite](https://t.me/joinchat/chatexample)',
    [
      paragraph([
        link('https://t.me/joinchat/chatexample', [plain('telegram invite')]),
      ]),
    ],
  ],
  [
    '[Github link with hash](https://github.com/RocketChat/Rocket.Chat/pull/26751/files#diff-c87b108ecf1ede549f8ede68eca840fbb330180b927df0b8a0b4df5d06cbd89b)',
    [
      paragraph([
        link(
          'https://github.com/RocketChat/Rocket.Chat/pull/26751/files#diff-c87b108ecf1ede549f8ede68eca840fbb330180b927df0b8a0b4df5d06cbd89b',
          [plain('Github link with hash')]
        ),
      ]),
    ],
  ],
  [
    '[Github link with hash](https://github.com/RocketChat/Rocket.Chat/pull/26751/files#diff)',
    [
      paragraph([
        link(
          'https://github.com/RocketChat/Rocket.Chat/pull/26751/files#diff',
          [plain('Github link with hash')]
        ),
      ]),
    ],
  ],
  [
    '[Github link without hash](https://github.com/RocketChat/Rocket.Chat/pull/26751/files)',
    [
      paragraph([
        link('https://github.com/RocketChat/Rocket.Chat/pull/26751/files', [
          plain('Github link without hash'),
        ]),
      ]),
    ],
  ],
  [
    '[Link with special chars](https://github.com/RocketChat/Rocket.Chat*[/]^_`{}~)',
    [
      paragraph([
        link('https://github.com/RocketChat/Rocket.Chat*[/]^_`{}~', [
          plain('Link with special chars'),
        ]),
      ]),
    ],
  ],
  [
    '[Google complex Link](https://www.google.com/url?rct=j&sa=t&url=https://ga.de/freizeit/region-erleben/bonn-und-region-tipps-fuers-wochenende-flohmarkt-rheinaue-weltkindertag-stadtfest_aid-53876987&ct=ga&cd=CAIyHDQ0NzEyYWE3MDA1MGNhNTQ6Y29tOmRlOkRFOlI&usg=AOvVaw3ySYrO9lM0iNSnk43gPVwZ)',
    [
      paragraph([
        link(
          'https://www.google.com/url?rct=j&sa=t&url=https://ga.de/freizeit/region-erleben/bonn-und-region-tipps-fuers-wochenende-flohmarkt-rheinaue-weltkindertag-stadtfest_aid-53876987&ct=ga&cd=CAIyHDQ0NzEyYWE3MDA1MGNhNTQ6Y29tOmRlOkRFOlI&usg=AOvVaw3ySYrO9lM0iNSnk43gPVwZ',
          [plain('Google complex Link')]
        ),
      ]),
    ],
  ],
  [
    '[Rocket.Chat](https://rocket.chat) Inline Text',
    [
      paragraph([
        link('https://rocket.chat', [plain('Rocket.Chat')]),
        plain(' Inline Text'),
      ]),
    ],
  ],
  [
    'https://analytics.zoho.com/open-view/123456789 Same Line',
    [
      paragraph([
        link('https://analytics.zoho.com/open-view/123456789', [
          plain('https://analytics.zoho.com/open-view/123456789'),
        ]),
        plain(' Same Line'),
      ]),
    ],
  ],
  [
    `[Rocket.Chat](https://rocket.chat)
Text after in a new line after link`,
    [
      paragraph([link('https://rocket.chat', [plain('Rocket.Chat')])]),
      paragraph([plain('Text after in a new line after link')]),
    ],
  ],
  [
    `https://analytics.zoho.com/open-view/123456789
Second line`,
    [
      paragraph([
        link('https://analytics.zoho.com/open-view/123456789', [
          plain('https://analytics.zoho.com/open-view/123456789'),
        ]),
      ]),
      paragraph([plain('Second line')]),
    ],
  ],
  [
    `[Rocket.Chat](https://rocket.chat)

Text after line break`,
    [
      paragraph([link('https://rocket.chat', [plain('Rocket.Chat')])]),
      lineBreak(),
      paragraph([plain('Text after line break')]),
    ],
  ],
  [
    `
[List Header Link](https://rocket.chat)
- First item
- Second item
- Third item
- *Fourth item*
`.trim(),
    [
      paragraph([link('https://rocket.chat', [plain('List Header Link')])]),
      unorderedList([
        listItem([plain('First item')]),
        listItem([plain('Second item')]),
        listItem([plain('Third item')]),
        listItem([bold([plain('Fourth item')])]),
      ]),
    ],
  ],
  [
    `[List Header Link](https://rocket.chat)
7. First item
2. Second item
8. Third item
4. *Fourth item*
15. *Fifteenth item*
`.trim(),
    [
      paragraph([link('https://rocket.chat', [plain('List Header Link')])]),
      orderedList([
        listItem([plain('First item')], 7),
        listItem([plain('Second item')], 2),
        listItem([plain('Third item')], 8),
        listItem([bold([plain('Fourth item')])], 4),
        listItem([bold([plain('Fifteenth item')])], 15),
      ]),
    ],
  ],
  [
    '[9gag](https://9gag.com/)',
    [paragraph([link('https://9gag.com/', [plain('9gag')])])],
  ],
  ['[9gag](9gag.com)', [paragraph([link('9gag.com', [plain('9gag')])])]],
  ['<9gag.com|9gag>', [paragraph([link('9gag.com', [plain('9gag')])])]],
  ['9gag.com', [paragraph([link('//9gag.com', [plain('9gag.com')])])]],
  [
    '[notes link](notes://Server/C3257116002CAD60/0/CCAF6BE2824A1F49432588D2001FA73E)',
    [
      paragraph([
        link(
          'notes://Server/C3257116002CAD60/0/CCAF6BE2824A1F49432588D2001FA73E',
          [plain('notes link')]
        ),
      ]),
    ],
  ],
  [
    '[File Path](C:/Users/user1/Documents/projects/file.js)',
    [
      paragraph([
        link('C:/Users/user1/Documents/projects/file.js', [plain('File Path')]),
      ]),
    ],
  ],
  [
    '[Test with **bold** element](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [plain('Test with '), bold([plain('bold')]), plain(' element')]
        ),
      ]),
    ],
  ],
  [
    '[Test with *bold* element](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [plain('Test with '), bold([plain('bold')]), plain(' element')]
        ),
      ]),
    ],
  ],
  [
    '[Test with _italic_ element](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [plain('Test with '), italic([plain('italic')]), plain(' element')]
        ),
      ]),
    ],
  ],
  [
    '[Test with ~strike~ element](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [plain('Test with '), strike([plain('strike')]), plain(' element')]
        ),
      ]),
    ],
  ],
  [
    '[Test with __**~~title~~**__ element](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)',
    [
      paragraph([
        link(
          'https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351',
          [
            plain('Test with '),
            italic([bold([strike([plain('title')])])]),
            plain(' element'),
          ]
        ),
      ]),
    ],
  ],
  [
    '([Github Issue: #24929](https://github.com/RocketChat/Rocket.Chat/issues/24929))',
    [
      paragraph([
        plain('('),
        link('https://github.com/RocketChat/Rocket.Chat/issues/24929', [
          plain('Github Issue: #24929'),
        ]),
        plain(')'),
      ]),
    ],
  ],
  [
    'the [audio_url and video_url for post message attachments](https://developer.rocket.chat/reference/api/rest-api/endpoints/core-endpoints/chat-endpoints/postmessage)',
    [
      paragraph([
        plain('the '),
        link(
          'https://developer.rocket.chat/reference/api/rest-api/endpoints/core-endpoints/chat-endpoints/postmessage',
          [plain('audio_url and video_url for post message attachments')]
        ),
      ]),
    ],
  ],
  [
    'the [Jira [Task] parentheses not working](rocket.chat)',
    [
      paragraph([
        plain('the '),
        link('rocket.chat', [plain('Jira [Task] parentheses not working')]),
      ]),
    ],
  ],
  [
    'the [Jira (Task) parentheses not working](rocket.chat)',
    [
      paragraph([
        plain('the '),
        link('rocket.chat', [plain('Jira (Task) parentheses not working')]),
      ]),
    ],
  ],
  [
    '[Jira [Task] parentheses not working](rocket.chat)',
    [
      paragraph([
        link('rocket.chat', [plain('Jira [Task] parentheses not working')]),
      ]),
    ],
  ],
  [
    '[Jira (Task) parentheses not working](rocket.chat)',
    [
      paragraph([
        link('rocket.chat', [plain('Jira (Task) parentheses not working')]),
      ]),
    ],
  ],
  // Should not parse as link
  ['77.77%', [paragraph([plain('77.77%')])]],
  ['77.77', [paragraph([plain('77.77')])]],
  ['https://77.77', [paragraph([plain('https://77.77')])]],
  ['test.9gag', [paragraph([plain('test.9gag')])]],
  [
    '[here](https://github.com/RocketChat/Rocket.Chat/releases/tag/6.0.0-rc.3)',
    [
      paragraph([
        link(
          'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.0.0-rc.3',
          [plain('here')]
        ),
      ]),
    ],
  ],
  [
    '[ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [ ~ [test](https://rocket.chat)',
    [
      paragraph([
        link('https://rocket.chat', [
          plain(' '),
          strike([plain(' [ ')]),
          plain(' [ '),
          strike([plain(' [ ')]),
          plain(' [ '),
          strike([plain(' [ ')]),
          plain(' [ '),
          strike([plain(' [ ')]),
          plain(' [ '),
          strike([plain(' [ ')]),
          plain(' [ '),
          strike([plain(' [ ')]),
          plain(' [ '),
          strike([plain(' [ ')]),
          plain(' [test'),
        ]),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
