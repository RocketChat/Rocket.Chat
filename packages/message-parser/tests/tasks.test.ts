import { parse } from '../src';
import {
  plain,
  tasks,
  task,
  mentionUser,
  mentionChannel,
  link,
  bold,
  emoji,
} from '../src/utils';

test.each([
  [
    `
- [ ] this is an incomplete item
- [x] this is a complete item
- [x] @mentions, #refs, [links](http://localhost), **formatting**
- [x] list syntax required (any unordered or ordered list supported)
- [ ] :smile:
`.trim(),
    [
      tasks([
        task([plain('this is an incomplete item')], false),
        task([plain('this is a complete item')], true),
        task(
          [
            mentionUser('mentions'),
            plain(', '),
            mentionChannel('refs'),
            plain(', '),
            link('http://localhost', [plain('links')]),
            plain(', '),
            bold([plain('formatting')]),
          ],
          true,
        ),
        task(
          [
            plain(
              'list syntax required (any unordered or ordered list supported)',
            ),
          ],
          true,
        ),
        task([emoji('smile')], false),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
