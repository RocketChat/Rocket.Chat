<!--header-->

<p align="center">
  <a href="https://rocket.chat" title="Rocket.Chat">
    <img src="https://github.com/RocketChat/Rocket.Chat.Artwork/raw/master/Logos/2020/png/logo-horizontal-red.png" alt="Rocket.Chat" />
  </a>
</p>

# `@rocket.chat/message-parser`

> Rocket.Chat parser for messages

---

[![npm@latest](https://img.shields.io/npm/v/@rocket.chat/message-parser/latest?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/message-parser/v/latest) [![npm@next](https://img.shields.io/npm/v/@rocket.chat/message-parser/next?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/message-parser/v/next) ![npm downloads](https://img.shields.io/npm/dw/@rocket.chat/message-parser?style=flat-square) ![License: MIT](https://img.shields.io/npm/l/@rocket.chat/message-parser?style=flat-square)

![deps](https://img.shields.io/librariesio/release/npm/@rocket.chat/message-parser?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/min/@rocket.chat/message-parser?style=flat-square)

<!--/header-->

## Description

Rocket.Chat grammar with the purpose of parsing the messages of the rocket chat, converting text to an AST tree.

The grammar provides support for markdown, mentions and emojis.

## Supported markup

- quotes
- bold/italic/strike
- ordered lists
- unordered lists
- task lists
- phone numbers
- mentions
- emoji
- colors
- URI's
- mentions users/channels
- timestamps

## Timestamps

The timestamp tag is a special tag that allows you to convert a Unix timestamp to a human-readable date and time.

Timestamps are allowed inside strike elements.

### Usage

Pattern: <t:{timestamp}:?{format}>

- {timestamp} is a Unix timestamp
- {format} is an optional parameter that can be used to customize the date and time format.

#### Formats

| Format | Description               | Example                                 |
| ------ | ------------------------- | --------------------------------------- |
| `t`    | Short time                | 12:00 AM                                |
| `T`    | Long time                 | 12:00:00 AM                             |
| `d`    | Short date                | 12/31/2020                              |
| `D`    | Long date                 | Thursday, December 31, 2020             |
| `f`    | Full date and time        | Thursday, December 31, 2020 12:00 AM    |
| `F`    | Full date and time (long) | Thursday, December 31, 2020 12:00:00 AM |
| `R`    | Relative time             | 1 year ago                              |

## Contributing

<!--contributing(msg)-->

Contributions, issues, and feature requests are welcome!<br />
Feel free to check the [issues](https://github.com/RocketChat/fuselage/issues).

<!--/contributing(msg)-->

Whenever you find a grammar-related bug, start by inserting the test case.

We are open to other tags/markups, as long as they don't generate unexpected behavior.

## Observations and known issues

- Nested lists are unsupported
- `URL` rule doesn't allow whitespace, `(`, or `)`
