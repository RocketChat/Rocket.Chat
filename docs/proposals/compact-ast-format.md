# Proposal: Compact AST Format for message-parser

## Status

Draft

## Problem

The current message-parser AST is verbose — every node carries its full text content as self-contained strings. For a message like `**hello** world`, the AST stores `"hello"` inside the Bold node and `" world"` in a separate Plain node, even though both substrings already exist in the original message. This redundancy inflates payload size, especially for messages with deeply nested formatting (bold inside italic inside strikethrough, etc.).

In high-traffic environments, parsed messages are stored and transmitted frequently. Reducing the AST footprint has a direct impact on storage costs, cache efficiency, and wire transfer size.

## Proposed Solution

Introduce a **compact AST format** that replaces self-contained string values with **span references** (`[start, end]`) into the original message text.

### Core Idea

Instead of:

```json
{
  "type": "PARAGRAPH",
  "value": [
    { "type": "BOLD", "value": [{ "type": "PLAIN_TEXT", "value": "hello" }] },
    { "type": "PLAIN_TEXT", "value": " world" }
  ]
}
```

The compact format stores:

```json
{ "t": "p", "c": [{ "t": "b", "c": [[2, 7]] }, [8, 14]] }
```

Plain text nodes become simple `[start, end]` tuples. Structural nodes use short type keys (`b`, `i`, `s`, `p`, `h`, etc.) and reference children via the same span mechanism.

### Key Operations

| Function | Description |
|---|---|
| `compactify(ast, msg)` | Converts a verbose AST + original message into a compact AST |
| `expand(compactAst, msg)` | Reconstructs the full verbose AST from a compact AST + original message |
| `validateRoundtrip(ast, msg)` | Verifies `expand(compactify(ast, msg), msg)` equals the original AST |

### Compact Type Mapping

| Verbose Type | Compact Key | Notes |
|---|---|---|
| `PLAIN_TEXT` | `[start, end]` | Span tuple, no wrapper object |
| `BOLD` | `b` | |
| `ITALIC` | `i` | |
| `STRIKE` | `s` | |
| `SPOILER` | `\|\|` | |
| `INLINE_CODE` | `` ` `` | |
| `MENTION_USER` | `@` | |
| `MENTION_CHANNEL` | `#` | |
| `INLINE_KATEX` | `$` | |
| `LINK` | `a` | |
| `IMAGE` | `img` | |
| `EMOJI` | `:` | |
| `TIMESTAMP` | `ts` | |
| `COLOR` | `c` | Stores RGBA as `[r, g, b, a]` |
| `PARAGRAPH` | `p` | |
| `HEADING` | `h` | Includes level `l: 1..4` |
| `CODE` | ```` ``` ```` | |
| `BLOCKQUOTE` | `>` | |
| `QUOTE` | `q` | |
| `SPOILER_BLOCK` | `\|\|\|` | |
| `ORDERED_LIST` | `ol` | |
| `UNORDERED_LIST` | `ul` | |
| `TASKS` | `tl` | |
| `KATEX` | `$$` | |
| `LINE_BREAK` | `br` | |
| `BIG_EMOJI` | `E` | |

## Trade-offs

### Advantages

- Significant size reduction on typical messages (observed 30-60% in initial tests)
- Lossless — roundtrip conversion preserves the full AST
- The original message is already stored alongside the AST, so no additional data is needed
- Short keys further reduce payload size

### Concerns

- Requires the original message text to be available at expansion time
- Adds a conversion layer — any bug in `compactify`/`expand` could corrupt message rendering
- Span-based references are fragile if the message text is modified after compaction
- Increases complexity in the message-parser package

## Open Questions

1. **Storage strategy** — Should compact ASTs replace verbose ones in the database, or coexist (e.g., compact for wire transfer, verbose for rendering)?
2. **Migration path** — How do we handle existing messages already stored with verbose ASTs?
3. **Rendering integration** — Should gazzodown learn to render compact ASTs directly, or always expand first?
4. **Message edits** — When a message is edited, do we reparse and recompact, or invalidate the compact form?
5. **Performance budget** — Is the compactify/expand overhead acceptable on the hot path, or should it be deferred to a background job?

## Reference

A working proof-of-concept implementation exists with full bidirectional conversion and roundtrip validation tests. It covers all current AST node types including BigEmoji, lists, tasks, code blocks, KaTeX, and color nodes.
