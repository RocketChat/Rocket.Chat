---
"@rocket.chat/message-parser": patch
---

feat(message-parser): add timestamps pattern

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
