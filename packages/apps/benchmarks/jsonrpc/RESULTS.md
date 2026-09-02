# JSON-RPC bridge benchmark results

Run of `yarn workspace @rocket.chat/apps bench:jsonrpc` on top of commit
`d9d8467f86`, with the three-contender benchmark in the working tree.

| item      | value                                              |
| --------- | -------------------------------------------------- |
| date      | 2026-09-01                                          |
| CPU       | 11th Gen Intel Core i7-11800H @ 2.30GHz, 8C/16T     |
| memory    | 22 GiB                                              |
| OS        | Linux 7.0.0-30-generic                              |
| node      | v22.22.3                                            |
| msgpack   | `@msgpack/msgpack` 3.0.0-beta2                      |
| baseline  | `jsonrpc-lite` 2.2.0                                |
| settings  | 14 fixtures, 7 samples of ~50 ms each (defaults)    |

The machine is a developer laptop, not an isolated bench host. The speed tables
repeat to within a few percent between runs. The GC table does not; read it as a
trend.

**Correctness: all 14 fixtures round-trip identically through all 3 pipelines.**

## The three pipelines

| contender          | types          | wire form                                    | receive                          |
| ------------------ | -------------- | -------------------------------------------- | -------------------------------- |
| `jsonrpc-lite`     | `jsonrpc-lite` | plain msgpack map of the object's properties | decode, then `parseObject()`     |
| `in-house, no ext` | in-house       | plain msgpack map of the object's properties | decode, then `hydrate()`         |
| `in-house`         | in-house       | positional tuple behind the codec extension  | decode; the class comes back     |

Column 1 against column 2 measures the types. Column 2 against column 3 measures
the codec's JSON-RPC extension, and nothing else. The `vs` columns in every table
below read `in-house` against that column, so `vs in-house, no ext` is the answer
about the extension.

`hydrate()` is generous to the no-extension side on purpose: one field test per
branch, no validation, no copy of `params`. What the extension does not beat
there, it does not beat at all.

## Summary

### Is the extension worth it? On this corpus, no.

- **It costs 10% of encode**, on every fixture but one, in both runs.
- **It returns almost nothing on receive**: 0.98x and 0.97x in the two runs. The
  instance the extension hands back costs about what `hydrate()` costs to build.
- **Round-trip is 0.92x**: the extension makes the whole corpus 8% slower.
- **It costs 34% of the 64 KiB upload round-trip.** The extension serializes the
  message into its own buffer and the outer encoder then copies that buffer into
  the frame, so a large payload is copied twice.
- **It buys 0.4% of the wire** over the corpus, and 13-65% on the small control
  messages. The bytes go to a pipe on the same machine, so 25 bytes saved per
  message do not pay for 50-700 ns of extra encode.
- **It wins one fixture outright**: `bridge error: doCreate rejected` encodes
  2.3x faster. That message is all envelope and no payload, and the tuple form
  drops 5 map keys plus the nested `error` map.

The 64 KiB upload dominates the corpus totals. Take it out and the extension
still loses:

| step       | ext vs no ext, corpus | ext vs no ext, corpus minus the upload |
| ---------- | --------------------- | -------------------------------------- |
| encode     | 0.88x                 | 0.91x                                  |
| receive    | 0.98x                 | 0.99x                                  |
| round-trip | 0.92x                 | 0.95x                                  |

### What the in-house types bought is untouched by this

The win over `jsonrpc-lite` sits in the types, not in the extension. Column 2 -
the in-house types on the *old* codec - already carries all of it: build 3,200x,
receive 11.8x, round-trip 10.1x. `jsonrpc-lite` validated every message with a
throwaway `JSON.stringify`, and that is the whole gap.

## Wire size

Bytes msgpack writes to the pipe. Deterministic. The two no-extension columns are
byte-for-byte equal, so every byte saved belongs to the extension.

| fixture                                  | jsonrpc-lite | in-house, no ext | in-house | vs jsonrpc-lite | vs in-house, no ext |
| ---------------------------------------- | ------------ | ---------------- | -------- | --------------- | ------------------- |
| app:getStatus                            | 57 B         | 57 B             | 32 B     | -43.9%          | -43.9%              |
| app:construct (real app package)         | 5.4 KiB      | 5.4 KiB          | 5.4 KiB  | -0.4%           | -0.4%               |
| app:executePostMessageSent               | 641 B        | 641 B            | 617 B    | -3.7%           | -3.7%               |
| app:executePreFileUpload (64 KiB Buffer) | 64.1 KiB     | 64.1 KiB         | 64.1 KiB | -0.0%           | -0.0%               |
| bridge result: doCreate -> messageId     | 52 B         | 52 B             | 34 B     | -34.6%          | -34.6%              |
| bridge result: doGetById -> user         | 201 B        | 201 B            | 183 B    | -9.0%           | -9.0%               |
| bridge error: doCreate rejected          | 77 B         | 77 B             | 47 B     | -39.0%          | -39.0%              |
| bridges:getMessageBridge:doCreate        | 188 B        | 188 B            | 163 B    | -13.3%          | -13.3%              |
| bridges:getUserBridge:doGetById          | 92 B         | 92 B             | 67 B     | -27.2%          | -27.2%              |
| bridges:getHttpBridge:doCall             | 851 B        | 851 B            | 827 B    | -2.8%           | -2.8%               |
| log notification (12 entries)            | 2.0 KiB      | 2.0 KiB          | 2.0 KiB  | -1.0%           | -1.0%               |
| ready notification                       | 34 B         | 34 B             | 12 B     | -64.7%          | -64.7%              |
| app result + logs                        | 1.1 KiB      | 1.1 KiB          | 1.1 KiB  | -1.5%           | -1.5%               |
| app error + logs                         | 1.2 KiB      | 1.2 KiB          | 1.2 KiB  | -2.9%           | -2.9%               |
| **TOTAL**                                | **76.0 KiB** | **76.0 KiB**     | **75.7 KiB** | **-0.4%**   | **-0.4%**           |

## Speed - build

ns per message, median of 7 samples. Lower is better. Above 1.00x means
`in-house` wins. The extension never runs in this step, so columns 2 and 3 are
the same code and their ratio is the noise floor of the harness: 1.00x.

| fixture                                  | jsonrpc-lite | in-house, no ext | in-house | vs jsonrpc-lite | vs in-house, no ext |
| ---------------------------------------- | ------------ | ---------------- | -------- | --------------- | ------------------- |
| app:getStatus                            | 66           | 15               | 17       | 3.81x           | 0.89x               |
| app:construct (real app package)         | 23,273       | 17               | 17       | 1406.31x        | 1.00x               |
| app:executePostMessageSent               | 4,772        | 17               | 16       | 295.12x         | 1.04x               |
| app:executePreFileUpload (64 KiB Buffer) | 843,996      | 18               | 18       | 47811.92x       | 1.01x               |
| bridge result: doCreate -> messageId     | 29           | 23               | 22       | 1.32x           | 1.05x               |
| bridge result: doGetById -> user         | 25           | 19               | 19       | 1.28x           | 0.96x               |
| bridge error: doCreate rejected          | 44           | 35               | 35       | 1.25x           | 1.00x               |
| bridges:getMessageBridge:doCreate        | 373          | 18               | 18       | 20.87x          | 1.00x               |
| bridges:getUserBridge:doGetById          | 113          | 16               | 16       | 6.95x           | 1.00x               |
| bridges:getHttpBridge:doCall             | 5,446        | 16               | 16       | 330.32x         | 0.98x               |
| log notification (12 entries)            | 18,046       | 18               | 18       | 1002.62x        | 1.00x               |
| ready notification                       | 83           | 18               | 18       | 4.56x           | 1.00x               |
| app result + logs                        | 24           | 19               | 18       | 1.34x           | 1.06x               |
| app error + logs                         | 40           | 31               | 31       | 1.29x           | 1.00x               |
| **TOTAL (one of each of the 14)**        | **896,327**  | **280**          | **279**  | **3211.73x**    | **1.00x**           |

## Speed - encode

| fixture                                  | jsonrpc-lite | in-house, no ext | in-house | vs jsonrpc-lite | vs in-house, no ext |
| ---------------------------------------- | ------------ | ---------------- | -------- | --------------- | ------------------- |
| app:getStatus                            | 506          | 508              | 562      | 0.90x           | 0.90x               |
| app:construct (real app package)         | 16,917       | 16,786           | 17,500   | 0.97x           | 0.96x               |
| app:executePostMessageSent               | 7,165        | 7,470            | 9,107    | 0.79x           | 0.82x               |
| app:executePreFileUpload (64 KiB Buffer) | 8,805        | 6,676            | 11,571   | 0.76x           | 0.58x               |
| bridge result: doCreate -> messageId     | 470          | 474              | 543      | 0.87x           | 0.87x               |
| bridge result: doGetById -> user         | 2,802        | 2,624            | 3,451    | 0.81x           | 0.76x               |
| bridge error: doCreate rejected          | 1,296        | 1,317            | 577      | 2.25x           | 2.28x               |
| bridges:getMessageBridge:doCreate        | 1,914        | 1,935            | 2,781    | 0.69x           | 0.70x               |
| bridges:getUserBridge:doGetById          | 1,355        | 1,348            | 1,284    | 1.06x           | 1.05x               |
| bridges:getHttpBridge:doCall             | 8,019        | 8,049            | 8,802    | 0.91x           | 0.91x               |
| log notification (12 entries)            | 25,757       | 24,787           | 27,566   | 0.93x           | 0.90x               |
| ready notification                       | 396          | 394              | 436      | 0.91x           | 0.90x               |
| app result + logs                        | 14,848       | 14,380           | 15,819   | 0.94x           | 0.91x               |
| app error + logs                         | 15,218       | 15,645           | 17,002   | 0.90x           | 0.92x               |
| **TOTAL (one of each of the 14)**        | **105,470**  | **102,392**      | **117,000** | **0.90x**    | **0.88x**           |

`bridges:getUserBridge:doGetById` is the one unstable row in this table. It read
1.05x here and 0.50x in the second run, on a fixture whose absolute cost is about
1.3 us. Do not read that row on its own.

## Speed - receive

| fixture                                  | jsonrpc-lite | in-house, no ext | in-house | vs jsonrpc-lite | vs in-house, no ext |
| ---------------------------------------- | ------------ | ---------------- | -------- | --------------- | ------------------- |
| app:getStatus                            | 724          | 534              | 597      | 1.21x           | 0.89x               |
| app:construct (real app package)         | 23,051       | 14,819           | 13,869   | 1.66x           | 1.07x               |
| app:executePostMessageSent               | 11,062       | 5,351            | 5,501    | 2.01x           | 0.97x               |
| app:executePreFileUpload (64 KiB Buffer) | 755,678      | 5,706            | 6,816    | 110.86x         | 0.84x               |
| bridge result: doCreate -> messageId     | 721          | 578              | 685      | 1.05x           | 0.84x               |
| bridge result: doGetById -> user         | 1,807        | 1,810            | 2,047    | 0.88x           | 0.88x               |
| bridge error: doCreate rejected          | 815          | 728              | 705      | 1.16x           | 1.03x               |
| bridges:getMessageBridge:doCreate        | 2,266        | 1,370            | 1,543    | 1.47x           | 0.89x               |
| bridges:getUserBridge:doGetById          | 1,022        | 716              | 776      | 1.32x           | 0.92x               |
| bridges:getHttpBridge:doCall             | 12,012       | 5,944            | 6,050    | 1.99x           | 0.98x               |
| log notification (12 entries)            | 34,235       | 15,444           | 15,597   | 2.19x           | 0.99x               |
| ready notification                       | 611          | 386              | 461      | 1.33x           | 0.84x               |
| app result + logs                        | 9,020        | 8,829            | 9,020    | 1.00x           | 0.98x               |
| app error + logs                         | 9,337        | 9,149            | 9,242    | 1.01x           | 0.99x               |
| **TOTAL (one of each of the 14)**        | **862,360**  | **71,365**       | **72,911** | **11.83x**    | **0.98x**           |

This is the table the extension was supposed to win, and it does not. Skipping a
parse step is worth something against `jsonrpc-lite`, which rebuilds and
re-validates the message. It is worth nothing against 6 lines that read 4 fields
and call a constructor.

## Speed - round-trip

| fixture                                  | jsonrpc-lite | in-house, no ext | in-house | vs jsonrpc-lite | vs in-house, no ext |
| ---------------------------------------- | ------------ | ---------------- | -------- | --------------- | ------------------- |
| app:getStatus                            | 1,871        | 1,910            | 1,811    | 1.03x           | 1.05x               |
| app:construct (real app package)         | 66,292       | 31,442           | 34,069   | 1.95x           | 0.92x               |
| app:executePostMessageSent               | 24,172       | 12,855           | 13,869   | 1.74x           | 0.93x               |
| app:executePreFileUpload (64 KiB Buffer) | 1,604,347    | 13,995           | 21,113   | 75.99x          | 0.66x               |
| bridge result: doCreate -> messageId     | 1,837        | 1,773            | 1,783    | 1.03x           | 0.99x               |
| bridge result: doGetById -> user         | 4,575        | 4,474            | 5,164    | 0.89x           | 0.87x               |
| bridge error: doCreate rejected          | 2,235        | 2,121            | 1,988    | 1.12x           | 1.07x               |
| bridges:getMessageBridge:doCreate        | 4,649        | 3,793            | 3,998    | 1.16x           | 0.95x               |
| bridges:getUserBridge:doGetById          | 2,339        | 2,067            | 2,067    | 1.13x           | 1.00x               |
| bridges:getHttpBridge:doCall             | 25,663       | 14,080           | 14,952   | 1.72x           | 0.94x               |
| log notification (12 entries)            | 72,141       | 36,186           | 37,797   | 1.91x           | 0.96x               |
| ready notification                       | 1,777        | 1,590            | 1,588    | 1.12x           | 1.00x               |
| app result + logs                        | 22,429       | 21,006           | 22,002   | 1.02x           | 0.95x               |
| app error + logs                         | 21,778       | 21,697           | 22,421   | 0.97x           | 0.97x               |
| **TOTAL (one of each of the 14)**        | **1,856,104** | **168,990**     | **184,622** | **10.05x**   | **0.92x**           |

The extension is slower than the plain map on 10 of the 14 fixtures. It wins two
(`app:getStatus`, `bridge error`), ties one, and loses the upload badly.

## Why encode gets slower

`ExtensionCodec` hands the encoder a byte array, not a stream position. So the
extension has to run a second, nested `Encoder` over the message, take the
`Uint8Array` it returns, and let the outer encoder copy it into the frame.

For a small control message that costs one nested encoder call, about 50-100 ns,
and the tuple form gives some of it back by dropping the map keys. For a message
that carries a payload it costs a full copy of the payload: the 64 KiB upload
encodes in 6.7 us as a plain map and 11.6 us through the extension.

`hoisting the codec instances` (commit `9167e771ae`) already removed the other
half of this cost, which was a fresh `Encoder` and its 2 KiB buffer per message.
The copy is what is left, and no amount of pooling removes it.

## GC pressure - round-trip

Collections and pause time per 1M messages. Lower is better. The counter is
process-wide, so only the 64 KiB row is far outside the noise.

| fixture                                  | jsonrpc-lite        | in-house, no ext | in-house       | vs in-house, no ext |
| ---------------------------------------- | ------------------- | ---------------- | -------------- | ------------------- |
| app:getStatus                            | 104 / 19 ms         | 98 / 26 ms       | 122 / 16 ms    | -37.8%              |
| app:construct (real app package)         | 3,937 / 809 ms      | 2,487 / 420 ms   | 2,613 / 587 ms | +39.5%              |
| app:executePostMessageSent               | 890 / 212 ms        | 775 / 188 ms     | 786 / 172 ms   | -8.5%               |
| app:executePreFileUpload (64 KiB Buffer) | 182,266 / 93,744 ms | 3,918 / 526 ms   | 5,878 / 902 ms | +71.7%              |
| bridge result: doCreate -> messageId     | 97 / 25 ms          | 93 / 17 ms       | 117 / 25 ms    | +46.9%              |
| bridge result: doGetById -> user         | 269 / 68 ms         | 266 / 58 ms      | 304 / 81 ms    | +39.6%              |
| bridge error: doCreate rejected          | 137 / 39 ms         | 127 / 29 ms      | 153 / 33 ms    | +13.3%              |
| bridges:getMessageBridge:doCreate        | 297 / 66 ms         | 276 / 72 ms      | 294 / 33 ms    | -53.8%              |
| bridges:getUserBridge:doGetById          | 154 / 15 ms         | 151 / 15 ms      | 178 / 18 ms    | +21.8%              |
| bridges:getHttpBridge:doCall             | 1,192 / 133 ms      | 955 / 107 ms     | 1,004 / 107 ms | +0.7%               |
| log notification (12 entries)            | 3,327 / 387 ms      | 2,789 / 308 ms   | 2,859 / 319 ms | +3.7%               |
| ready notification                       | 86 / 11 ms          | 81 / 10 ms       | 107 / 13 ms    | +30.9%              |
| app result + logs                        | 1,578 / 259 ms      | 1,577 / 188 ms   | 1,613 / 192 ms | +2.0%               |
| app error + logs                         | 1,685 / 187 ms      | 1,673 / 186 ms   | 1,692 / 188 ms | +1.2%               |

The pause times do not repeat between runs, but the collection counts do, and
they say the same thing as the speed tables: the extension allocates a little
more than the plain map on every small fixture, and 50% more on the upload. The
intermediate `Uint8Array` is that allocation.

## Retained heap

`heapUsed` + `external` still held by one received message. Lower is better.

| fixture                                  | jsonrpc-lite | in-house, no ext | in-house | vs jsonrpc-lite | vs in-house, no ext |
| ---------------------------------------- | ------------ | ---------------- | -------- | --------------- | ------------------- |
| app:getStatus                            | 185 B        | 144 B            | 145 B    | -21.6%          | +0.7%               |
| app:construct (real app package)         | 5.3 KiB      | 5.3 KiB          | 5.3 KiB  | -0.4%           | +0.4%               |
| app:executePostMessageSent               | 2.0 KiB      | 2.0 KiB          | 2.0 KiB  | -2.2%           | -0.1%               |
| app:executePreFileUpload (64 KiB Buffer) | 64.4 KiB     | 64.5 KiB         | 64.4 KiB | -0.1%           | -0.1%               |
| bridge result: doCreate -> messageId     | 141 B        | 98 B             | 99 B     | -29.4%          | +1.0%               |
| bridge result: doGetById -> user         | 715 B        | 673 B            | 672 B    | -5.9%           | -0.1%               |
| bridge error: doCreate rejected          | 228 B        | 168 B            | 168 B    | -26.1%          | -0.0%               |
| bridges:getMessageBridge:doCreate        | 628 B        | 585 B            | 581 B    | -7.4%           | -0.7%               |
| bridges:getUserBridge:doGetById          | 294 B        | 248 B            | 248 B    | -15.6%          | +0.3%               |
| bridges:getHttpBridge:doCall             | 2.5 KiB      | 2.4 KiB          | 2.4 KiB  | -1.6%           | -0.0%               |
| log notification (12 entries)            | 7.0 KiB      | 7.0 KiB          | 7.0 KiB  | -0.6%           | -0.0%               |
| ready notification                       | 138 B        | 97 B             | 96 B     | -31.0%          | -1.7%               |
| app result + logs                        | 3.9 KiB      | 3.8 KiB          | 3.8 KiB  | -1.1%           | -0.0%               |
| app error + logs                         | 4.0 KiB      | 3.9 KiB          | 3.9 KiB  | -1.4%           | -0.0%               |
| **TOTAL**                                | **91.4 KiB** | **90.9 KiB**     | **90.8 KiB** | **-0.7%**   | **-0.1%**           |

The received message is the same object either way, so this table is flat by
construction. It confirms that the extension holds nothing extra after the
message lands, and that the smaller retained heap against `jsonrpc-lite` comes
from the types.

Process at the end of the run: rss 203.39 MiB, heapUsed 50.18 MiB.

## Run-to-run stability

Two consecutive runs on the same machine.

| total               | run 1  | run 2  |
| ------------------- | ------ | ------ |
| **ext vs no ext**   |        |        |
| build               | 1.00x  | 0.99x  |
| encode              | 0.88x  | 0.88x  |
| receive             | 0.98x  | 0.97x  |
| round-trip          | 0.92x  | 0.93x  |
| wire size           | -0.4%  | -0.4%  |
| retained heap       | -0.1%  | -0.1%  |
| **ext vs jsonrpc-lite** |    |        |
| build               | 3211.73x | 2903.32x |
| encode              | 0.90x  | 0.87x  |
| receive             | 11.83x | 11.86x |
| round-trip          | 10.05x | 9.63x  |

## What to do with this

The extension is the wrong lever, not the wrong idea. Its two costs - the nested
encode and the payload copy - come from the `ExtensionCodec` interface, not from
the tuple wire form. The tuple itself is free and is where the byte savings are.

Three options, in order of how much they cost to try:

1. **Drop the extension.** Put the envelope on the wire as a plain map and
   categorize on receive, exactly like the `in-house, no ext` column. This costs
   nothing to implement (`hydrate()` in `contenders.ts` is the whole receiver),
   gives back 8-10% of encode, and gives up 13-65% of the bytes on small control
   messages.
2. **Move the tuple up one level.** Have the messenger encode
   `[kind, id, method, params]` itself and switch on element 0 after decode. This
   keeps every byte the extension saves, drops the nested encode and the payload
   copy, and needs no extension at all. Worth measuring before either of the
   others.
3. **Keep the extension.** Justified only if something outside this corpus values
   the bytes more than the CPU - a bridge that stops being a local pipe, for
   instance.

The `meta` slot noted as missing in `src/lib/jsonrpc.ts` is easier to add under
options 1 and 2 than under 3, because a map carries an optional key for free and
a tuple has to grow a slot on both sides.

## Note on the dependency

`jsonrpc-lite` was gone from `packages/apps/package.json`; commit `938d20930f`
removed it and the benchmark commit did not put it back. The run needs it, so
this run added `"jsonrpc-lite": "2.2.0"` to the workspace devDependencies. Drop
it again together with the `benchmarks/` folder once the numbers have served
their purpose.
