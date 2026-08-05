# Migrating from JavaScript

## TypeScript is a superset of JavaScript

TypeScript is an extension of JavaScript, meaning that when transitioning from JavaScript to TypeScript, you can employ the identical syntax used in JavaScript. Errors flagged by the TypeScript compiler (`tsc`) and ESLint enforce best practices, and both gate CI — [`ci-code-check`](../../.github/workflows/ci-code-check.yml) runs `turbo run typecheck` and `yarn lint` — so resolve them rather than leaving them in place.

When a diagnostic is genuinely wrong about the code, suppress it explicitly and narrowly:

- `@ts-expect-error` with a short reason, not `@ts-ignore` — it fails once the underlying error is gone, so the suppression can't outlive its cause (52 files use it against 3 for `@ts-ignore`);
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

Creating a `.d.ts` declaration file is strongly recommended when migrating large JavaScript modules. These files manage imports and exports, functioning as a module's interface. This approach is superior to JSDoc for planning and understanding module structure.

```ts
// hugeModule.d.ts
export function foo(): void; // maybe it will be placed in another module
export function bar(): void; // maybe it will be placed in another module
```
