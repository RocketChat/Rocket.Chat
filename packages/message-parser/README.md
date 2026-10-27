# `@rocket.chat/message-parser`

> Parses Rocket.Chat message text into an abstract syntax tree.

[![npm](https://img.shields.io/npm/v/@rocket.chat/message-parser?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/message-parser) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/message-parser?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/message-parser)

Rocket.Chat messages use a Markdown dialect with chat additions: user and channel mentions, emoji, timestamps, spoilers, colors and KaTeX. This package turns that text into a typed AST, so a client can render a message without parsing Markdown itself. Rocket.Chat stores the AST alongside each message and its clients render from it.

The parser is generated from a [Peggy](https://peggyjs.org/) grammar and has one runtime dependency, [`tldts`](https://github.com/remusao/tldts), used to recognize domain names in bare links.

## Installation

```sh
npm install @rocket.chat/message-parser
```

The package ships a single ES module bundle with TypeScript declarations. It runs in browsers and in Node.js (`engines` requires Node.js 22.22.3+ on the 22 line, or 24.15.0+ on the 24 line).

## Usage

### Parsing a message

```ts
import { parse } from '@rocket.chat/message-parser';

const ast = parse('Hello *world*, @john! See #general :smile:');
```

`parse` returns an array of block nodes. Text that is not inside a block becomes a `PARAGRAPH`:

```json
[
	{
		"type": "PARAGRAPH",
		"value": [
			{ "type": "PLAIN_TEXT", "value": "Hello " },
			{ "type": "BOLD", "value": [{ "type": "PLAIN_TEXT", "value": "world" }] },
			{ "type": "PLAIN_TEXT", "value": ", " },
			{ "type": "MENTION_USER", "value": { "type": "PLAIN_TEXT", "value": "john" } },
			{ "type": "PLAIN_TEXT", "value": "! See " },
			{ "type": "MENTION_CHANNEL", "value": { "type": "PLAIN_TEXT", "value": "general" } },
			{ "type": "PLAIN_TEXT", "value": " " },
			{ "type": "EMOJI", "value": { "type": "PLAIN_TEXT", "value": "smile" }, "shortCode": "smile" }
		]
	}
]
```

Every node has a `type` and a `value`; some carry extra fields, such as `level` on `HEADING`, `language` on `CODE` or `status` on `TASK`. A message made of one to three emoji and nothing else parses as a single `BIG_EMOJI` node, so it can be shown larger.

### Options

```ts
import { parse } from '@rocket.chat/message-parser';

const ast = parse(text, {
	colors: true,
	emoticons: true,
	katex: { dollarSyntax: true, parenthesisSyntax: true },
	customDomains: ['corp.internal'],
});
```

| Option                    | Default | Effect                                                                                                                 |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `colors`                  | off     | Parse `color:#rgb`, `color:#rgba`, `color:#rrggbb` and `color:#rrggbbaa` into `COLOR` nodes                            |
| `emoticons`               | off     | Parse ASCII emoticons such as `:)` and `<3` into `EMOJI` nodes                                                         |
| `katex.dollarSyntax`      | off     | Parse `$...$` (inline) and `$$...$$` (block) as KaTeX                                                                  |
| `katex.parenthesisSyntax` | off     | Parse `\(...\)` (inline) and `\[...\]` (block) as KaTeX                                                                |
| `customDomains`           | none    | Extra domains to autolink in bare links, such as intranet hosts. Public suffixes and `localhost` are always recognized |

### Walking the tree

`isNodeOfType` narrows an unknown node to a specific type:

```ts
import { isNodeOfType, parse } from '@rocket.chat/message-parser';
import type { Inlines } from '@rocket.chat/message-parser';

const mentionedUsers = (inlines: Inlines[]): string[] =>
	inlines.flatMap((node) => {
		if (isNodeOfType(node, 'MENTION_USER')) {
			return [node.value.value];
		}
		if (isNodeOfType(node, 'BOLD') || isNodeOfType(node, 'ITALIC') || isNodeOfType(node, 'STRIKE')) {
			return mentionedUsers(node.value as Inlines[]);
		}
		return [];
	});

const users = parse('hi @alice and *@bob*').flatMap((block) => (isNodeOfType(block, 'PARAGRAPH') ? mentionedUsers(block.value) : []));
// ['alice', 'bob']
```

### Fallback ranges

`TABLE`, `TIMESTAMP` and `HORIZONTAL_RULE` nodes carry a `fallback` field: the `[start, end]` offsets of the node's source text. A renderer that does not support one of these nodes can show `input.slice(start, end)` instead. Older stored ASTs may have a `PLAIN_TEXT` node there instead of a range.

### Supported markup

Blocks:

| Markup                                                    | Example                                   | Node                                      |
| --------------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Paragraph                                                 | any text                                  | `PARAGRAPH`                               |
| Heading, levels 1 to 4                                    | `# Title` … `#### Title`                  | `HEADING`                                 |
| Quote                                                     | `> quoted`                                | `QUOTE`                                   |
| Code block, with optional language                        | ` ```js ` … ` ``` `                       | `CODE` with `CODE_LINE`s                  |
| Long code fence (4+ backticks), which may contain ` ``` ` | ` ````md ` … ` ```` `                     | `CODE`                                    |
| Unordered list                                            | `- item` or `* item`                      | `UNORDERED_LIST` with `LIST_ITEM`s        |
| Ordered list                                              | `1. item`                                 | `ORDERED_LIST` with numbered `LIST_ITEM`s |
| Task list                                                 | `- [x] done` / `- [ ] todo`               | `TASKS` with `TASK`s                      |
| Nested lists (indented, any mix of the three list kinds)  | `- a` then `  - b`                        | `nested` on `LIST_ITEM` / `TASK`          |
| Table                                                     | see [Tables](#tables)                     | `TABLE`                                   |
| Horizontal rule (3+ dashes alone on a line)               | `---`                                     | `HORIZONTAL_RULE`                         |
| Spoiler block                                             | `\|\|` on its own line, text, then `\|\|` | `SPOILER_BLOCK`                           |
| KaTeX block (when enabled)                                | `$$...$$`, `\[...\]`                      | `KATEX`                                   |
| Empty line                                                |                                           | `LINE_BREAK`                              |

Inline:

| Markup                        | Example                                                        | Node                       |
| ----------------------------- | -------------------------------------------------------------- | -------------------------- |
| Bold                          | `*bold*`, `**bold**`                                           | `BOLD`                     |
| Italic                        | `_italic_`, `__italic__`                                       | `ITALIC`                   |
| Strikethrough                 | `~strike~`, `~~strike~~`                                       | `STRIKE`                   |
| Inline code                   | `` `code` ``                                                   | `INLINE_CODE`              |
| Spoiler                       | `\|\|hidden\|\|`                                               | `SPOILER`                  |
| Link                          | `[label](https://rocket.chat)`, `<https://rocket.chat\|label>` | `LINK`                     |
| Bare URL, email, phone number | `rocket.chat`, `a@b.com`, `+5511999999999`                     | `LINK` (`mailto:`, `tel:`) |
| Image                         | `![alt](https://example.com/a.png)`                            | `IMAGE`                    |
| User mention                  | `@john`, `@all`, `@user@server.com`                            | `MENTION_USER`             |
| Channel mention               | `#general`                                                     | `MENTION_CHANNEL`          |
| Emoji                         | `:smile:`, `😀`                                                | `EMOJI`                    |
| Emoticon (when enabled)       | `:)`, `<3`                                                     | `EMOJI`                    |
| Timestamp                     | `<t:1700000000:R>`                                             | `TIMESTAMP`                |
| Color (when enabled)          | `color:#ff0000`                                                | `COLOR`                    |
| Inline KaTeX (when enabled)   | `$x^2$`, `\(x^2\)`                                             | `INLINE_KATEX`             |

A backslash escapes only these characters: `*`, `_`, `~`, `` ` ``, `#` and `.`. Each backslash escapes a single character, so `\*not bold\*` stays plain text, but strikethrough needs both tildes escaped: `\~\~not struck\~\~`. Two other escapes exist: `\<t:1700000000:R>` keeps a timestamp as plain text, and `\|` escapes a pipe inside a table cell. Before any other character the backslash stays in the text and the markup still applies: `\[link](https://example.com)` renders a backslash followed by a link, and `\@john` a backslash followed by a mention.

Bold, italic and strikethrough can be nested inside each other.

### Tables

GFM-style tables. Every row needs a leading and a trailing pipe. Alignment comes from the delimiter row:

| Marker | Alignment |
| ------ | --------- |
| `:---` | left      |
| `:--:` | center    |
| `---:` | right     |
| `---`  | none      |

```md
| Header 1 | Header 2 |
| -------- | :------: |
| Cell 1   |  Cell 2  |
```

Escape a literal pipe inside a cell as `\|`. Cells can contain inline markup.

### Timestamps

`<t:{time}>` or `<t:{time}:{format}>` renders a date and time in the reader's locale and time zone. It also works inside strikethrough and bold.

`{time}` can be:

- a 10-digit Unix timestamp, e.g. `<t:1700000000>`;
- a date and time in the form `YYYY-MM-DDTHH:MM:SS`, optionally followed by three-digit milliseconds (`.sss`) and a numeric UTC offset (`+HH:MM` or `-HH:MM`), e.g. `<t:2025-07-22T10:00:00.000+00:00>`. Other ISO 8601 forms, such as a `Z` suffix (`<t:2025-07-22T10:00:00Z>`), a `+HHMM` offset or a time without seconds, are not recognized and stay plain text. Without an offset, the time is read in the time zone of the environment that parses the message, so include one;
- a time of day with a UTC offset, e.g. `<t:10:00+00:00>` or `<t:10:00:05-03:00>`. The date is the current UTC date when the message is parsed, not the local date in that offset: near midnight it can be a day apart, and the same message parsed on another day resolves to that day.

The node stores the time as a Unix timestamp string. `{format}` defaults to `t`:

| Format | Description               | Example                                 |
| ------ | ------------------------- | --------------------------------------- |
| `t`    | Short time                | 12:00 AM                                |
| `T`    | Long time                 | 12:00:00 AM                             |
| `d`    | Short date                | 12/31/2020                              |
| `D`    | Long date                 | Thursday, December 31, 2020             |
| `f`    | Full date and time        | Thursday, December 31, 2020 12:00 AM    |
| `F`    | Full date and time (long) | Thursday, December 31, 2020 12:00:00 AM |
| `R`    | Relative time             | 1 year ago                              |

Formatting is up to the renderer; the examples show how Rocket.Chat displays them.

### Known limitations

- A bare URL ends at the first `)`, so `https://en.wikipedia.org/wiki/Lint_(software)` loses its closing parenthesis. Wrap it in a Markdown link to keep it: `[Lint](https://en.wikipedia.org/wiki/Lint_(software))`.
- Horizontal rules only use `-`. `***` and `___` are left as text, because they collide with emphasis and with censored words.
- Headings stop at level 4. `##### text` is a paragraph.

## API

### `parse(input: string, options?: Options): Root`

Parses a message. Also exported as `parser`.

### `isNodeOfType(value: unknown, type: T): value is Types[T]`

Type guard that checks `value.type === type`.

### `asciiList: Record<string, string>`

The emoticon-to-emoji table used when `emoticons` is on, e.g. `':)'` → `'🙂'`.

### Types

| Type                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root` (alias `MarkdownAST`) | What `parse` returns: `Array<Paragraph \| Blocks>`, or `[BigEmoji]`                                                                                                                                                                                                                                                                                                                                                                               |
| `Options`                    | The options object above                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `Blocks`                     | Union of block nodes                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `Inlines`                    | Union of inline nodes                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ASTNode`                    | Union of the main node types                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Types`                      | Map from each `type` string to its node type; `TypesKeys` is its keys                                                                                                                                                                                                                                                                                                                                                                             |
| Node types                   | `Paragraph`, `Heading`, `Quote`, `Code`, `CodeLine`, `OrderedList`, `UnorderedList`, `ListItem`, `NestedList`, `Tasks`, `Task`, `Table`, `TableRow`, `TableCell`, `TableCellAlignment`, `HorizontalRule`, `LineBreak`, `SpoilerBlock`, `KaTeX`, `BigEmoji`, `Plain`, `Bold`, `Italic`, `Strike`, `Markup`, `InlineCode`, `Spoiler`, `Link`, `Image`, `UserMention`, `ChannelMention`, `Emoji`, `Color`, `Timestamp`, `InlineKaTeX`, `SourceRange` |

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/message-parser). From the repository root:

```sh
yarn workspace @rocket.chat/message-parser build
yarn workspace @rocket.chat/message-parser testunit
yarn workspace @rocket.chat/message-parser lint
yarn workspace @rocket.chat/message-parser typecheck
yarn workspace @rocket.chat/message-parser bench
yarn workspace @rocket.chat/message-parser bench:size
```

The grammar is [`src/grammar.pegjs`](https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/message-parser/src/grammar.pegjs). `build` bundles it with webpack and [`@rocket.chat/peggy-loader`](https://www.npmjs.com/package/@rocket.chat/peggy-loader) into `dist/messageParser.js`. `bench` runs parser benchmarks; `bench:size` prints the raw and gzipped size of the built bundle.

### Changing the grammar

When you find a grammar bug, start by adding a test case under `tests/` that reproduces it. New markup is welcome as long as it does not change how existing messages parse.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
