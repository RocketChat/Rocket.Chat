import { parse } from '../src';
import { link, paragraph, plain } from '../src/utils';

test.each([
  [
    'joe@joe.com',
    [paragraph([link('mailto:joe@joe.com', [plain('joe@joe.com')])])],
  ],
  [
    "joe@joe.com is Joe's email",
    [
      paragraph([
        link('mailto:joe@joe.com', [plain('joe@joe.com')]),
        plain(" is Joe's email"),
      ]),
    ],
  ],
  [
    "Joe's email is joe@joe.com because it is",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:joe@joe.com', [plain('joe@joe.com')]),
        plain(' because it is'),
      ]),
    ],
  ],
  [
    "Joe's email is joe@joe.com",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:joe@joe.com', [plain('joe@joe.com')]),
      ]),
    ],
  ],
  [
    "Joe's email is joe@joe.com. Try emailing him",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:joe@joe.com', [plain('joe@joe.com')]),
        plain('. Try emailing him'),
      ]),
    ],
  ],
  [
    "Joe's email is joe.smith@joe.com",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:joe.smith@joe.com', [plain('joe.smith@joe.com')]),
      ]),
    ],
  ],
  [
    "Joe's email is JOE@JOE.COM",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:JOE@JOE.COM', [plain('JOE@JOE.COM')]),
      ]),
    ],
  ],
  [
    "Joe's email is (joe@joe.com)",
    [
      paragraph([
        plain("Joe's email is ("),
        link('mailto:joe@joe.com', [plain('joe@joe.com')]),
        plain(')'),
      ]),
    ],
  ],
  [
    "Joe's email is (joe_roe@joe.com)",
    [
      paragraph([
        plain("Joe's email is ("),
        link('mailto:joe_roe@joe.com', [plain('joe_roe@joe.com')]),
        plain(')'),
      ]),
    ],
  ],
  [
    "Joe's email is (joe'roe@joe.com)",
    [
      paragraph([
        plain("Joe's email is ("),
        link("mailto:joe'roe@joe.com", [plain("joe'roe@joe.com")]),
        plain(')'),
      ]),
    ],
  ],
  [
    "Joe's email is mañana@mañana.com",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:mañana@mañana.com', [plain('mañana@mañana.com')]),
      ]),
    ],
  ],
  [
    "Joe's email is Кириллица@Кириллица.com",
    [
      paragraph([
        plain("Joe's email is "),
        link('mailto:Кириллица@Кириллица.com', [
          plain('Кириллица@Кириллица.com'),
        ]),
      ]),
    ],
  ],
  ['Hi there@stuff', [paragraph([plain('Hi there@stuff')])]],
  [
    'My email is busueng.kim@aaa.com',
    [
      paragraph([
        plain('My email is '),
        link('mailto:busueng.kim@aaa.com', [plain('busueng.kim@aaa.com')]),
      ]),
    ],
  ],
  [
    'My email is mailto:asdf@asdf.com',
    [
      paragraph([
        plain('My email is '),
        link('mailto:asdf@asdf.com', [plain('asdf@asdf.com')]),
      ]),
    ],
  ],
  [
    'My email is fake@gmail.c',
    [paragraph([plain('My email is fake@gmail.c')])],
  ],
  [
    'My email is fake@gmail.comf',
    [paragraph([plain('My email is fake@gmail.comf')])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
