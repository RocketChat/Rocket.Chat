# Migrating from JavaScript

## TypeScript is a superset of JavaScript

TypeScript is an extension of JavaScript, meaning that when transitioning from JavaScript to TypeScript, you can employ the identical syntax used in JavaScript. Many errors flagged by the TypeScript compiler (`tsc`) and ESLint enforce best practices, though some can be disregarded if they don't affect functionality.

## JSDoc

When `allowJs` is enabled in `tsconfig.json`, JSDoc comments can document types within JavaScript code. This is particularly useful during gradual migration when `tsc` struggles with type inference.

Example with `@typedef`:

```js
// module.js

/**
 * @typedef {Object} Foo
 * @property {string} bar
 * @property {string} qux
 */

export const foo = { bar: 'baz' };

foo.qux = 'quux';
```

Alternative using the `@type` tag:

```js
// module.js

/**
 * @type {{ bar: string; qux: string }}
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
