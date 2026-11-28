# Schema measurements and probes

The scripts behind the *Schema library* and the *`shaped<T>()`* sections of the
[delivery plan](../README.md). They resolve
`zod`, `@sinclair/typebox` and `ajv` from the monorepo root `node_modules`, so run `yarn` at the root
first.

Run both from the repository root.

## Strict-mode inference probe

[`strict-inference-probe.ts`](./strict-inference-probe.ts) compiles only if a required field stays
required. Each `@ts-expect-error` line fails as "unused" if the library makes the field optional.

```sh
for s in true false; do
	echo "strict: $s"
	node_modules/.bin/tsc --noEmit --strict $s --skipLibCheck \
		--module nodenext --moduleResolution nodenext --target es2022 \
		docs/proposals/apps-runtime-sdk-ipc/benchmarks/strict-inference-probe.ts && echo pass
done
```

## Validation benchmark

[`validation-bench.mjs`](./validation-bench.mjs) validates one `addReaction`-sized input with
compiled AJV and with Zod `safeParse`, 2 million times each after a warm-up. It also times a
`structuredClone` of the full request, for scale.

```sh
node docs/proposals/apps-runtime-sdk-ipc/benchmarks/validation-bench.mjs
```

## `shaped<T>()` type probe

[`shaped-type-probe.ts`](./shaped-type-probe.ts) compiles only if all four claims hold:

- A plain `z.looseObject` cannot type an interface value (`TS2322`).
- `shaped<T>()` types the value as the interface.
- A key that the interface does not have is a compile error.
- A field schema that does not match the field type still compiles, because the cast is unchecked.

```sh
for s in true false; do
	node_modules/.bin/tsc --noEmit --strict $s --skipLibCheck \
		--module nodenext --moduleResolution nodenext --target es2022 \
		docs/proposals/apps-runtime-sdk-ipc/benchmarks/shaped-type-probe.ts && echo "strict: $s pass"
done
```

## `message.create` runtime probe

[`shaped-runtime-probe.mjs`](./shaped-runtime-probe.mjs) runs the `message.create` input schema
against valid and hostile inputs. It prints one line per check and exits non-zero if one fails.

```sh
node docs/proposals/apps-runtime-sdk-ipc/benchmarks/shaped-runtime-probe.mjs
```

## Recorded results

Zod 4.3.6, TypeBox 0.34.33, AJV 8.20.0, on 2026-09-22.

| Measurement | Result |
| --- | --- |
| Probe, `strict: true` | pass, both libraries |
| Probe, `strict: false` | pass, both libraries |
| `shaped<T>()` type probe, `strict: true` and `false` | pass |
| `message.create` runtime probe | 5 of 5 pass |
| AJV compiled | 17.6 ns per call |
| Zod `safeParse` | 48.6 ns per call |
| `structuredClone` of the request | 1782 ns per call |

The numbers come from one machine. Compare the ratios, not the absolute values.
