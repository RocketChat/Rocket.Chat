# TypeScript general conventions

## Don't use CommonJS features

Avoid using CommonJS features such as `require` and `module` alongside ES module constructs like `import` and `export`. The preference is for ES modules due to their enhanced portability and user-friendly nature. However, keep in mind that synchronous conditional imports aren't possible in ES modules.

Example of CommonJS (not recommended):

```ts
// commonjs.ts
if (condition) {
	const foo = require('foo');
	module.exports = foo;
} else {
	module.exports = {};
}
```

Invalid ES module pattern:

```ts
// esmodule.ts
if (condition) {
	import foo from 'foo';
	export default foo;
} else {
	export default {};
}
```

## Prefer `import type` over `import`

Prioritize using `import type` for type-only imports. While a regular `import` works for both JavaScript and TypeScript, it can include module output code in the bundle. The `import type` construct is specific to TypeScript compilation and avoids unnecessary code inclusion.

```ts
// Foo.ts
export class Foo {
	bar: string;

	constructor(bar: string) {
		this.bar = bar;
	}
}

// Bar.ts
export class Bar {
	foo: Foo;

	constructor(foo: Foo) {
		this.foo = foo;
	}
}

// index.ts
import { Foo } from './Foo';
import type { Bar } from './Bar';

export const foo = new Foo('baz');
declare const bar: Bar;

// index.js (transpiled from index.ts)
import { Foo } from './Foo';
export const foo = new Foo('baz');
```

`Foo` is constructed, so its import is emitted; `Bar` is only ever a type, so `import type { Bar }` disappears entirely.

Note that TypeScript also elides a plain `import` whose bindings are only used in type positions, so writing `import` where `import type` belongs is usually not what bloats the output. `import type` is preferred because it states the intent, fails loudly if someone later uses the binding as a value, and is what tooling that transpiles file-by-file — `isolatedModules`, `verbatimModuleSyntax`, esbuild, SWC — needs in order to strip the import without consulting the type checker.

## Know the difference between `type` and `interface`

An `interface` serves as a type declaration similar to a class construct, while a `class` functions as an actual class declaration.

```ts
interface IThing {
	prop: string;
	method(): void;
}

class Thing implements IThing {
	public prop = 'foo';

	method(): void {
		console.log('bar');
	}
}
```

A `type` construct is similar to an interface but offers greater flexibility. The `type` construct permits declaration of union types:

```ts
type Foo = string | number;
```

An `interface` can declare generic types:

```ts
interface IFoo<T> {
	prop: T;
}
```

A `type` also supports generics and conditional types, providing more adaptability:

```ts
type Foo<T> = T extends string ? { foo: number } : { bar: number };
```

## Avoid using classes as namespaces

Pattern to avoid:

```ts
// foo.ts
class Foo {
	bar(): void {
		// ...
	}
}

export const foo = new Foo();

// index.ts
import { foo } from './foo';

foo.bar();
```

Preferred approach (when no state is needed):

```ts
// foo.ts
export function bar(): void {
	// ...
}

// index.ts
import * as foo from './foo';

foo.bar();
```

Valid use case (when managing state):

```ts
// foo.ts
class Foo {
	baz: number;

	bar(): void {
		// perform actions referencing and modifying `this.baz`
	}
}

export const foo = new Foo();

// index.ts
import { foo } from './foo';

foo.bar();
```

Classes are reasonable when they encapsulate state and provide a controlled interface for modification.

## Avoid using the `any` type except when it's used as a constraint

Refrain from using `any` under most circumstances. Instead, follow this model:

- `unknown` serves as the universal type, encompassing all potential values;
- `any` should not be seen as an actual type, but rather as a means to disable TypeScript's type checking.

Using `any` is discouraged as it indicates unawareness regarding the type being manipulated. Working with `unknown` necessitates type narrowing, leading to more robust code.

```ts
// Avoid using any
declare const foo: any;
foo.bar(); // No compilation error

// Prefer using unknown
declare const bar: unknown;
bar.baz(); // Compilation error

const hasBaz = (bar: unknown): bar is { baz(): void } =>
	typeof bar === 'object' && bar !== null && 'baz' in bar && typeof (bar as { baz: unknown }).baz === 'function';

if (hasBaz(bar)) {
	bar.baz(); // No compilation error
}
```

Exception — generic type constraints:

```ts
type X<F> = F extends (x: unknown) => void ? true : false;
type Y<F> = F extends (x: any) => void ? true : false;

type A = X<(x: string) => void>; // `false`, because x is not `unknown`
type B = Y<(x: string) => void>; // `true`, because x is anything
```
