# Message parse length limit

`MESSAGE_MAX_PARSE_LENGTH` caps how long a message can be before Rocket.Chat stops parsing it into a markdown tree (`md`). Messages over the limit are stored without `md` and rendered as plain text, line breaks included (`toPlainTextRoot`).

The server reads it in `BeforeSaveMarkdownParser`. The client gets the same value through the `rc-message-parser-max-length` meta tag, so messages that arrive without `md` are not parsed in the browser either.

| Value   | Behavior                                   |
| ------- | ------------------------------------------ |
| unset   | `MESSAGE_MAX_PARSE_LENGTH_DEFAULT` (10000) |
| `0`     | no limit, every message is parsed          |
| `N > 0` | messages longer than `N` are not parsed    |

The limit is compared against `msg.length`, so the unit is UTF-16 code units (characters for most text), not bytes.

## Why the default is 10000

Until 9.0.0 the default was `0`. It was changed after benchmarking `@rocket.chat/message-parser` (production bundle, full options: colors, emoticons, KaTeX) against payloads from 1K to 2M characters. Each payload ran in a fresh Node 24 process on an Apple M3 Pro, and the median of 3–5 runs was recorded.

Parsing is synchronous, so the parse time is how long the event loop is blocked for every other user on that instance.

| Payload     |     5K |    10K |    20K |    50K |   100K |   500K |     1M |     2M |
| ----------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: |
| `plain`     | 3.8 ms | 7.0 ms |  11 ms |  24 ms |  39 ms | 160 ms | 316 ms | 665 ms |
| `realistic` | 3.9 ms | 8.1 ms |  12 ms |  33 ms |  54 ms | 183 ms | 386 ms | 658 ms |
| `code`      | 0.4 ms | 0.9 ms | 1.4 ms | 2.9 ms | 4.7 ms |  15 ms |  26 ms |  50 ms |
| `logs`      |  18 ms |  44 ms | 152 ms | 885 ms |  3.6 s |      — |      — |      — |
| `dense`     | 7.3 ms |  10 ms |  20 ms |  41 ms |  73 ms | 343 ms | 658 ms |  1.4 s |
| `unclosed`  |  10 ms |  17 ms |  31 ms |  69 ms | 138 ms | 623 ms |  1.2 s |  2.5 s |
| `nospace`   | 0.8 ms | 1.4 ms | 2.6 ms | 5.1 ms | 8.2 ms |  33 ms |  70 ms | 140 ms |
| `urls`      | 1.0 ms | 1.9 ms | 4.3 ms | 7.5 ms |  11 ms |  47 ms |  86 ms | 164 ms |
| `brackets`  | 121 ms | 469 ms |  1.8 s | 11.9 s |      — |      — |      — |      — |

Payloads: `plain` is one paragraph of prose; `realistic` mixes mentions, links, emoji, lists, quotes and inline code; `code` is a fenced block; `logs` is pasted log lines such as `... INFO [server] request handled ...`; `dense` is back-to-back formatting tokens; `unclosed` is unmatched `*_~`; `nospace` is a base64-like blob; `urls` is a run of links; `brackets` is unmatched `[`. A dash means the run was skipped after a smaller size exceeded 120 s (`logs` at 250K) or became impractical.

The stored tree also grows faster than the text:

| Payload     |      5K |     10K |     20K |     50K |    100K |     500K |       1M |       2M |
| ----------- | ------: | ------: | ------: | ------: | ------: | -------: | -------: | -------: |
| `realistic` | 0.03 MB | 0.07 MB | 0.14 MB | 0.34 MB | 0.68 MB |  3.39 MB |  6.78 MB | 13.57 MB |
| `dense`     | 0.14 MB | 0.27 MB | 0.54 MB | 1.35 MB | 2.70 MB | 13.52 MB | 27.05 MB | 54.09 MB |
| `unclosed`  | 0.05 MB | 0.11 MB | 0.21 MB | 0.53 MB | 1.06 MB |  5.31 MB | 10.63 MB | 21.26 MB |

What the numbers show:

- Ordinary content is linear and cheap, about 0.5–1 ms per 1K characters.
- An unmatched `[` makes parsing quadratic, and so does anything containing one, like the `[server]` tags in `logs`. Text size alone cannot make this case safe; the threshold only bounds it.
- Heavily formatted text yields a tree up to ~27× the size of the message. Around 500K characters, `msg` plus `md` approaches MongoDB's 16 MB document limit; past it the message cannot be saved at all. Every client that loads the message also receives the tree.

10000 is twice the default `Message_MaxAllowedSize` (5000), so on default settings no message sent through a path that enforces that setting is skipped by the limit. At 10000, normal messages parse in under 10 ms with trees under 0.3 MB, and the worst known input blocks for about 0.5 s instead of an unbounded time. Doubling the limit to 20000 already allows 1.8 s on that input.

Workspaces that raised `Message_MaxAllowedSize` and want long messages formatted can set `MESSAGE_MAX_PARSE_LENGTH` higher, or to `0` for the old behavior.
