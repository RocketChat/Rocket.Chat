# JSON-RPC bridge benchmark results

## TL;DR

- In-house types improve build by 3,200x, receive by 11.8x, round-trip by 10.1x versus `jsonrpc-lite`.
- Remove the JSON-RPC extension: with it, encode reads 0.88x and round-trip reads 0.92x of the plain-map result.
- Extension saves 0.4% wire bytes while introducing an extra payload copy on large messages.
- Use in-house types with plain msgpack maps; categorize messages on receive with type guards.

## Strategy

The first strategy to replace the jsonrpc-lite package was to simply implement the same class structure the package exported with our own module.

This allowed for an experiment: add a custom extension to the msgpack codec that was aware of the class types and applied a different approach to encoding/decoding them.

However, this showed a small size gain on the wire at the cost of some speed. In the end, we applied factories that generate simple - classless - objects, save for the JsonRpcError.

In the document, these strategies are referenced as:

- **`in-house`** — the codec extension encodes the message as a positional tuple, `[kind, id, method, params]`. The receiver gets the object back from the extension, with no parse step.
- **`in-house, no ext`** — plain msgpack writes the object's properties as a map. `hydrate()` reads 4 fields on receive and builds the result.

## Outcome

The benchmark supports two sequential changes:

1. **Remove `jsonrpc-lite` and use the in-house types.** This is where the large performance win comes from.
2. **Remove the JSON-RPC codec extension.** This removes the extension's encode/copy overhead with essentially no runtime cost, at the expense of the tuple's small wire-size savings.

After the second change, all three pipelines use the same wire representation byte-for-byte, and the remaining differences are at the benchmark's noise floor.

A re-run after the change confirms it. The `vs in-house, no ext` totals read build 0.99x, encode 1.00x, receive 0.99x, and round-trip 1.01x. Against `jsonrpc-lite`, the same re-run reads build 2,780x, receive 11.66x, and round-trip 10.41x. Encode recovers from 0.90x to 1.00x-1.07x. The 64 KiB upload no longer pays a double copy.

The error payload still uses `JsonRpcError` because the runtime uses `instanceof` to distinguish failed handlers from successful ones. Its wire type is `SerializedJsonRpcError`. The classes were not the source of the measured cost: the `in-house, no ext` column used them throughout.

`meta` now crosses the process boundary as well. A plain map can carry it without adding a tuple slot.

Run of `yarn workspace @rocket.chat/apps bench:jsonrpc` on commit `d9d8467f86`, with the three-contender benchmark in the working tree.

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

The machine is a developer laptop, not an isolated benchmark host. Speed results repeat within a few percent; GC measurements are less stable and should be read as trends.

**Correctness: all 14 fixtures round-trip identically through all 3 pipelines.**

## 1. Remove `jsonrpc-lite`

The first comparison isolates the type implementation:

- `jsonrpc-lite`: `jsonrpc-lite` types, plain msgpack map, `parseObject()`
- `in-house`: in-house types, positional tuple behind the codec extension
- `in-house, no ext`: in-house types, plain msgpack map, `hydrate()`

`hydrate()` favors the no-extension side on purpose. It runs one field test per branch, with no validation and no copy of `params`.

The important result is that **the in-house types provide the major win over `jsonrpc-lite`**.

The old-codec in-house path already delivers:

- **build:** 3,200x
- **receive:** 11.8x
- **round-trip:** 10.1x

The `in-house, no ext` column carries the same win. Its totals give build 3,201x, receive 12.1x, and round-trip 11.0x.

`jsonrpc-lite` validates every message with a throwaway `JSON.stringify`, which accounts for most of the gap.

### Wire size

Bytes that msgpack writes to the pipe. The values are deterministic. The two no-extension columns are byte-for-byte equal, so every saved byte belongs to the extension.

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
| bridges:getHttpBridge:doCall             | 851 B        | 851 B            | 827 B    | -2.8%           | -2.8%              |
| log notification (12 entries)            | 2.0 KiB      | 2.0 KiB          | 2.0 KiB  | -1.0%           | -1.0%               |
| ready notification                       | 34 B         | 34 B             | 12 B     | -64.7%          | -64.7%              |
| app result + logs                        | 1.1 KiB      | 1.1 KiB          | 1.1 KiB  | -1.5%           | -1.5%              |
| app error + logs                         | 1.2 KiB      | 1.2 KiB          | 1.2 KiB  | -2.9%           | -2.9%               |
| **TOTAL**                                | **76.0 KiB** | **76.0 KiB**     | **75.7 KiB** | **-0.4%**   | **-0.4%**           |

### Speed — build

ns per message, median of 7 samples. Lower is better. A value above 1.00x means `in-house` wins. The extension never runs in this step. Columns 2 and 3 are therefore the same code, and their ratio gives the noise floor of the harness: 1.00x.

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

### Speed — encode

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

`bridges:getUserBridge:doGetById` is unstable: 1.05x here and 0.50x in the second run, with an absolute cost of about 1.3 us. Do not interpret that row in isolation.

### Speed — receive

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

### Speed — round-trip

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

**Step 1 conclusion:** the in-house types are the real performance improvement. The large gains over `jsonrpc-lite` remain when the extension is removed.

---

## 2. Remove the JSON-RPC extension

This comparison isolates the extension:

- `in-house, no ext`: plain msgpack map of the object's properties, `hydrate()`
- `in-house`: positional tuple behind the codec extension

The two no-extension representations are byte-for-byte equal. This means the `vs in-house, no ext` columns isolate the extension itself.

### Summary

On this corpus, **the extension is not worth its runtime cost**:

- **encode:** `0.88x` vs no extension
- **receive:** `0.98x`
- **round-trip:** `0.92x`
- **wire size:** `-0.4%`
- **64 KiB upload round-trip:** the extension costs **34%**
- **small control messages:** the tuple saves **13-65%** of the bytes

The bytes go to a pipe on the same machine. 25 saved bytes per message do not pay for 50-700 ns of extra encode.

The 64 KiB upload exposes the main problem: the extension serializes the message into its own buffer, then the outer encoder copies that buffer into the frame. The payload is therefore copied twice.

Without the upload, the extension still loses:

| step       | ext vs no ext, corpus | ext vs no ext, corpus minus the upload |
| ---------- | --------------------- | -------------------------------------- |
| encode     | 0.88x                 | 0.91x                                  |
| receive    | 0.98x                 | 0.99x                                  |
| round-trip | 0.92x                 | 0.95x                                  |

The extension wins one encode fixture outright: `bridge error: doCreate rejected`, at `2.3x`. That message is all envelope and no payload, and the tuple form drops 5 map keys plus the nested `error` map.

On round-trip the extension is slower than the plain map on 10 of the 14 fixtures. It wins `app:getStatus` (`1.05x`) and `bridge error: doCreate rejected` (`1.07x`), ties two fixtures, and loses the upload badly.

The skipped parse step helps against `jsonrpc-lite`, but not against a six-line `hydrate()` that reads 4 fields and constructs the result.

### Speed against `jsonrpc-lite`

The extension does not change the first conclusion:

| total | run 1 | run 2 |
| ----- | ----- | ----- |
| **ext vs jsonrpc-lite** | | |
| build | 3211.73x | 2903.32x |
| encode | 0.90x | 0.87x |
| receive | 11.83x | 11.86x |
| round-trip | 10.05x | 9.63x |

The in-house types retain the large gains over `jsonrpc-lite`, while the extension itself is slower than the plain map.

### Why encode gets slower

`ExtensionCodec` supplies a byte array rather than a stream position. The extension therefore:

1. runs a nested `Encoder`,
2. allocates the returned `Uint8Array`,
3. lets the outer encoder copy those bytes into the frame.

For small control messages, the nested encoder costs about **50-100 ns**. The tuple recovers some of that by dropping map keys.

For payloads, the full copy dominates:

- plain 64 KiB upload: **6.7 us**
- extension: **11.6 us**

Commit `9167e771ae` already removed the other half of this cost by hoisting the codec instances, avoiding a fresh `Encoder` and its **2 KiB** buffer per message. The payload copy remains.

### GC pressure — round-trip

Collections and pause time per 1M messages. Lower is better. The counter is process-wide, so only the 64 KiB row sits far outside the noise.

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

Pause times do not repeat between runs, but the collection counts do. They show a little more allocation with the extension on every small fixture, and 50% more on the upload. The intermediate `Uint8Array` is that allocation.

### Retained heap

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

The received object is the same either way, so retained heap is effectively flat. The smaller retained heap versus `jsonrpc-lite` comes from the in-house types, not the extension.

Process at the end of the run: `rss 203.39 MiB`, `heapUsed 50.18 MiB`.

### Run-to-run stability

Two consecutive runs on the same machine:

| total               | run 1  | run 2  |
| ------------------- | ------- | ------- |
| **ext vs no ext**   |         |         |
| build               | 1.00x   | 0.99x   |
| encode              | 0.88x   | 0.88x   |
| receive             | 0.98x   | 0.97x   |
| round-trip          | 0.92x   | 0.93x   |
| wire size           | -0.4%   | -0.4%   |
| retained heap       | -0.1%   | -0.1%   |
| **ext vs jsonrpc-lite** |    |         |
| build               | 3211.73x | 2903.32x |
| encode              | 0.90x   | 0.87x   |
| receive             | 11.83x  | 11.86x  |
| round-trip          | 10.05x  | 9.63x   |

## Final conclusion

The benchmark separates two independent effects:

### 1. The in-house types are the win

Compared with `jsonrpc-lite`, the in-house implementation improves build, receive, and round-trip by roughly **3,200x**, **11.8x**, and **10.1x** respectively.

### 2. The extension is not the win

Compared with the same in-house implementation without the extension, the extension reads **0.88x on encode** and **0.92x on round-trip**. That is 12% less encode throughput and 8% less round-trip throughput, for only **0.4% of total wire bytes**. The 64 KiB upload is particularly unfavorable because the extension introduces an extra payload copy.

The tuple wire format itself is not the problem. The overhead comes from using it through `ExtensionCodec`.

The resulting implementation choice is therefore:

- keep the **in-house types**
- remove the **JSON-RPC extension**
- send the envelope as a plain msgpack map
- categorize it on receive with the type guards in `src/lib/jsonrpc.ts`

`hydrate()` in `contenders.ts` is sufficient for the no-extension receiver.

The tuple could alternatively be moved up one level and encoded directly by the messenger as `[kind, id, method, params]`. That would preserve the tuple's wire-size savings without the nested encoder or payload copy, and is worth measuring separately.

The old extension is justified only if saving wire bytes becomes more important than the CPU cost—for example, if the bridge stops being a local pipe.

## Reference

- Benchmark commit: `d9d8467f86`
- Dependency removal: `938d20930f`
- Codec-instance hoisting: `9167e771ae`
- `jsonrpc-lite`: `2.2.0`
- `@msgpack/msgpack`: `3.0.0-beta2`

`jsonrpc-lite` was removed from `packages/apps/package.json` by `938d20930f`. The benchmark run temporarily added `"jsonrpc-lite": "2.2.0"` to workspace devDependencies so the baseline could still be measured. It can be removed again with the benchmark folder once the measurements are no longer needed.
