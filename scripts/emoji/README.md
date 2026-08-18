# emoji

Generates the emoji test fixture used by `@rocket.chat/message-parser`'s coverage test.

## `generateEmojiFixture.mjs`

Writes `packages/message-parser/tests/fixtures/allEmoji.ts` — the full list of every emoji `emojibase-data` ships. The message-parser coverage test parses each one and asserts it is recognized as a single emoji.

### When to run it

After bumping the `emojibase-data` dependency to a newer Unicode version:

```bash
node scripts/emoji/generateEmojiFixture.mjs
```

### Why

The fixture is a committed snapshot, not generated at test time. Regenerating it after a bump adds the newly-introduced emojis to the sweep, so any that the parser grammar doesn't yet recognize fail the test and flag exactly what needs a new grammar rule. Without regenerating, new emojis simply wouldn't be covered.
