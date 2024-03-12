import { parse } from '../src';
import { lineBreak, autoLink, paragraph, plain, link } from '../src/utils';

test.each([
  [
    'https://pt.wikipedia.org/wiki/Condi%C3%A7%C3%A3o_de_corrida#:~:text=Uma%20condi%C3%A7%C3%A3o%20de%20corrida%20%C3%A9,sequ%C3%AAncia%20ou%20sincronia%20doutros%20eventos',
    [
      paragraph([
        autoLink(
          'https://pt.wikipedia.org/wiki/Condi%C3%A7%C3%A3o_de_corrida#:~:text=Uma%20condi%C3%A7%C3%A3o%20de%20corrida%20%C3%A9,sequ%C3%AAncia%20ou%20sincronia%20doutros%20eventos'
        ),
      ]),
    ],
  ],
  [
    'https://pt.wikipedia.org/',
    [paragraph([autoLink('https://pt.wikipedia.org/')])],
  ],
  [
    'https://pt.wikipedia.org/with-hyphen',
    [paragraph([autoLink('https://pt.wikipedia.org/with-hyphen')])],
  ],
  [
    'https://pt.wikipedia.org/with_underscore',
    [paragraph([autoLink('https://pt.wikipedia.org/with_underscore')])],
  ],
  [
    'https://www.npmjs.com/package/@rocket.chat/message-parser',
    [
      paragraph([
        autoLink('https://www.npmjs.com/package/@rocket.chat/message-parser'),
      ]),
    ],
  ],
  ['http:/rocket.chat/teste', [paragraph([plain('http:/rocket.chat/teste')])]],
  ['https:/rocket.chat/', [paragraph([plain('https:/rocket.chat/')])]],
  ['https://test', [paragraph([plain('https://test')])]],
  [
    'httpsss://rocket.chat/test',
    [paragraph([autoLink('httpsss://rocket.chat/test')])],
  ],
  [
    'https://rocket.chat:3000/test',
    [paragraph([autoLink('https://rocket.chat:3000/test')])],
  ],
  [
    'https://rocket.chat/test?search',
    [paragraph([autoLink('https://rocket.chat/test?search')])],
  ],
  [
    'https://rocket.chat/test?search=test',
    [paragraph([autoLink('https://rocket.chat/test?search=test')])],
  ],
  ['https://rocket.chat', [paragraph([autoLink('https://rocket.chat')])]],
  ['https://localhost', [paragraph([autoLink('https://localhost')])]],
  ['https://localhost:3000', [paragraph([autoLink('https://localhost:3000')])]],
  [
    'https://localhost:3000#fragment',
    [paragraph([autoLink('https://localhost:3000#fragment')])],
  ],
  [
    'https://localhost:3000#',
    [paragraph([autoLink('https://localhost:3000#')])],
  ],
  [
    'https://localhost:3000?',
    [paragraph([autoLink('https://localhost:3000?')])],
  ],
  [
    'https://localhost:3000/',
    [paragraph([autoLink('https://localhost:3000/')])],
  ],
  [
    'ftp://user:pass@localhost:21/etc/hosts',
    [paragraph([autoLink('ftp://user:pass@localhost:21/etc/hosts')])],
  ],
  ['ssh://test@example.com', [paragraph([autoLink('ssh://test@example.com')])]],
  [
    'custom://test@example.com',
    [paragraph([autoLink('custom://test@example.com')])],
  ],
  ['ftp://example.com', [paragraph([autoLink('ftp://example.com')])]],
  [
    'https://www.thingiverse.com/thing:5451684',
    [paragraph([autoLink('https://www.thingiverse.com/thing:5451684')])],
  ],
  ['http://📙.la/❤️', [paragraph([autoLink('http://📙.la/❤️')])]],
  [
    'https://developer.rocket.chat/reference/api/rest-api#production-security-concerns look at this',
    [
      paragraph([
        autoLink(
          'https://developer.rocket.chat/reference/api/rest-api#production-security-concerns'
        ),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat/reference/api/rest-api look at this',
    [
      paragraph([
        autoLink('https://developer.rocket.chat/reference/api/rest-api'),
        plain(' look at this'),
      ]),
    ],
  ],

  [
    'https://developer.rocket.chat/reference/api/rest-api#fragment?query=query look at this',
    [
      paragraph([
        autoLink(
          'https://developer.rocket.chat/reference/api/rest-api#fragment?query=query'
        ),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat look at this',
    [
      paragraph([
        autoLink('https://developer.rocket.chat'),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat?query=query look at this',
    [
      paragraph([
        autoLink('https://developer.rocket.chat?query=query'),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat?query=query\nline break',
    [
      paragraph([autoLink('https://developer.rocket.chat?query=query')]),
      paragraph([plain('line break')]),
    ],
  ],
  [
    'https://developer.rocket.chat?query=query\n\nline break',
    [
      paragraph([autoLink('https://developer.rocket.chat?query=query')]),
      lineBreak(),
      paragraph([plain('line break')]),
    ],
  ],
  [
    'https://developer.rocket.chat?query=query_with_underscore look at this',
    [
      paragraph([
        autoLink('https://developer.rocket.chat?query=query_with_underscore'),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat/path_with_underscore look at this',
    [
      paragraph([
        autoLink('https://developer.rocket.chat/path_with_underscore'),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat#fragment_with_underscore look at this',
    [
      paragraph([
        autoLink('https://developer.rocket.chat#fragment_with_underscore'),
        plain(' look at this'),
      ]),
    ],
  ],
  [
    'https://developer.rocket.chat followed by text',
    [
      paragraph([
        autoLink('https://developer.rocket.chat'),
        plain(' followed by text'),
      ]),
    ],
  ],
  [
    'two urls https://developer.rocket.chat , https://rocket.chat',
    [
      paragraph([
        plain('two urls '),
        autoLink('https://developer.rocket.chat'),
        plain(' , '),
        autoLink('https://rocket.chat'),
      ]),
    ],
  ],
  [
    'https://1developer.rocket.chat',
    [paragraph([autoLink('https://1developer.rocket.chat')])],
  ],
  [
    'https://en.m.wikipedia.org/wiki/Main_Page',
    [paragraph([autoLink('https://en.m.wikipedia.org/wiki/Main_Page')])],
  ],
  ['test.1test.com', [paragraph([autoLink('test.1test.com')])]],
  [
    'http://test.e-xample.com',
    [paragraph([autoLink('http://test.e-xample.com')])],
  ],
  ['www.n-tv.de', [paragraph([autoLink('www.n-tv.de')])]],
  [
    'www.n-tv.de/test, test',
    [paragraph([autoLink('www.n-tv.de/test'), plain(', test')])],
  ],
  [
    'www.n-tv.de/, test',
    [paragraph([autoLink('www.n-tv.de/'), plain(', test')])],
  ],
  [
    'www.n-tv.de, test',
    [paragraph([autoLink('www.n-tv.de'), plain(', test')])],
  ],
  [
    'https://www.n-tv.de, test',
    [paragraph([autoLink('https://www.n-tv.de'), plain(', test')])],
  ],
  ['http://te_st.com', [paragraph([autoLink('http://te_st.com')])]],
  ['www.te_st.com', [paragraph([autoLink('www.te_st.com')])]],
  [
    '[google_search](http://google.com)',
    [paragraph([link('http://google.com', [plain('google_search')])])],
  ],
  [
    'app...https://rocket.chat https://rocket.chat',
    [
      paragraph([
        plain('app...https://rocket.chat '),
        autoLink('https://rocket.chat'),
      ]),
    ],
  ],
  [
    'Hey check it out the best communication platform https://rocket.chat! There is not discussion about it.',
    [
      paragraph([
        plain('Hey check it out the best communication platform '),
        autoLink('https://rocket.chat'),
        plain('! There is not discussion about it.'),
      ]),
    ],
  ],
  [
    'This is a normal phrase.This in another phrase.',
    [paragraph([plain('This is a normal phrase.This in another phrase.')])],
  ],
  [
    'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.0.0-rc.3',
    [
      paragraph([
        autoLink(
          'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.0.0-rc.3'
        ),
      ]),
    ],
  ],
  [
    'https://www.rocket.chat/(W(601))/Main?ScreenId=GI000027',
    [
      paragraph([
        autoLink('https://www.rocket.chat/(W(601))/Main?ScreenId=GI000027'),
      ]),
    ],
  ],
  [
    'https://rocketchat.atlassian.net/browse/OC-718?filter=10078&jql=%22Defect%20from%5BVersion%20Picker%20(multiple%20versions)%5D%22%20%3D%206.0.0%20AND%20%22Defect%20from%5BVersion%20Picker%20(multiple%20versions)%5D%22%20%3D%206.0.0%20AND%20created%20%3E%3D%20-48h%20ORDER%20BY%20cf%5B10070%5D%20ASC%2C%20status%20ASC%2C%20created%20DESC',
    [
      paragraph([
        link(
          'https://rocketchat.atlassian.net/browse/OC-718?filter=10078&jql=%22Defect%20from%5BVersion%20Picker%20(multiple%20versions)%5D%22%20%3D%206.0.0%20AND%20%22Defect%20from%5BVersion%20Picker%20(multiple%20versions)%5D%22%20%3D%206.0.0%20AND%20created%20%3E%3D%20-48h%20ORDER%20BY%20cf%5B10070%5D%20ASC%2C%20status%20ASC%2C%20created%20DESC'
        ),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});

describe('autoLink with custom hosts settings comming from Rocket.Chat', () => {
  test.each([
    [
      'http://gitlab.local',
      [paragraph([autoLink('http://gitlab.local', ['local'])])],
    ],
    ['gitlab.local', [paragraph([autoLink('gitlab.local', ['local'])])]],
    [
      'internaltool.intranet',
      [paragraph([autoLink('internaltool.intranet', ['local', 'intranet'])])],
    ],
  ])('parses %p', (input, output) => {
    expect(
      parse(input, { customDomains: ['local', 'intranet'] })
    ).toMatchObject(output);
  });
});

describe('autoLink WITHOUT custom hosts settings comming from Rocket.Chat', () => {
  test.each([
    [
      'https://internaltool.testt',
      [paragraph([plain('https://internaltool.testt')])],
    ],
  ])('parses %p', (input, output) => {
    expect(parse(input, { customDomains: ['local'] })).toMatchObject(output);
  });
});

describe('autoLink helper function', () => {
  it('should preserve the original protocol if the protocol is http or https', () => {
    expect(autoLink('https://rocket.chat/test')).toMatchObject(
      link('https://rocket.chat/test')
    );

    expect(autoLink('http://rocket.chat/test')).toMatchObject(
      link('http://rocket.chat/test')
    );
  });

  it('should preserve the original protocol even if for custom protocols', () => {
    expect(autoLink('custom://rocket.chat/test')).toMatchObject(
      link('custom://rocket.chat/test')
    );
  });

  it('should return // as the protocol if // is the protocol specified', () => {
    expect(autoLink('//rocket.chat/test')).toMatchObject(
      link('//rocket.chat/test')
    );
  });

  it("should return an url concatenated '//' if the url has no protocol", () => {
    expect(autoLink('rocket.chat/test')).toMatchObject(
      link('//rocket.chat/test', [plain('rocket.chat/test')])
    );
  });

  it("should return an url concatenated '//' if the url has no protocol and has sub-domain", () => {
    expect(autoLink('spark-public.s3.amazonaws.com')).toMatchObject(
      link('//spark-public.s3.amazonaws.com', [
        plain('spark-public.s3.amazonaws.com'),
      ])
    );
  });

  it("should return an plain text url due to invalid TLD that's validate with the external library TLDTS", () => {
    expect(autoLink('rocket.chattt/url_path')).toMatchObject(
      plain('rocket.chattt/url_path')
    );
  });
});
