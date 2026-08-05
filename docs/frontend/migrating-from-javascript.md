# Migrating from JavaScript

## TypeScript is a superset of JavaScript

TypeScript is an extension of JavaScript, meaning that when transitioning from JavaScript to TypeScript, you can employ the identical syntax used in JavaScript. Errors flagged by the TypeScript compiler (`tsc`) and ESLint enforce best practices, and both gate CI — [`ci-code-check`](../../.github/workflows/ci-code-check.yml) runs `turbo run typecheck` and `yarn lint` — so resolve them rather than leaving them in place.

When a diagnostic is genuinely wrong about the code, suppress it explicitly and narrowly:

- `@ts-expect-error` with a short reason, rather than `@ts-ignore` — it fails once the underlying error is gone, so the suppression can't outlive its cause;
- `eslint-disable-next-line`, naming the specific rule rather than disabling the line wholesale.

## JSDoc

When `allowJs` is enabled in `tsconfig.json`, JSDoc comments can document types within JavaScript code. This is particularly useful during gradual migration when `tsc` struggles with type inference.

Example with `@typedef`:

```js
// module.js

/**
 * @typedef {Object} Foo
 * @property {string} bar
 * @property {string} [qux]
 */

/** @type {Foo} */
export const foo = { bar: 'baz' };

foo.qux = 'quux';
```

Alternative using the `@type` tag:

```js
// module.js

/**
 * @type {{ bar: string; qux?: string }}
 */
export const foo = { bar: 'baz' };

foo.qux = 'quux';
```

Both approaches help ensure TypeScript accurately recognizes the complete type structure.

## Declare a `*.d.ts` file

Creating a `.d.ts` declaration file is strongly recommended when migrating large JavaScript modules. It describes the module's public surface for type checking and is easier to read as a whole than JSDoc scattered through the implementation.

A declaration file is types only: it is erased at build time and creates no runtime code. Place it alongside the JavaScript module it describes, with the same basename, and declare only exports that module actually has — TypeScript will trust the declaration over the `.js`, so anything you declare that isn't really exported will typecheck at the import site and be `undefined` at runtime.

```ts
// hugeModule.d.ts — sits next to hugeModule.js

export function foo(): void; // hugeModule.js exports `foo`
export function bar(): void; // hugeModule.js exports `bar`
```

Writing the file is still a good way to plan the shape you're migrating toward, but it only records exports; it can't create or relocate them. If an export belongs in another module, move the implementation first, then declare it beside its new home.
