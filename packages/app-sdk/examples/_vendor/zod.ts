/**
 * MINIMAL ZOD SHIM — compile-time convenience only.
 *
 * The examples are written exactly as a real app would write them —
 * `import { z } from 'zod'` — so they read as production code. This repo has not
 * `pnpm install`-ed zod into this proposal package, so the package's tsconfig
 * maps the `'zod'` specifier to this file (see `tsconfig.json` `paths`). It
 * implements just enough of Zod's surface (with correct type inference) for the
 * examples to type-check and run. A real app deletes this file and depends on
 * the `zod` package; nothing else changes.
 *
 * Zod v4 implements the Standard Schema spec, which is the contract the SDK's
 * `Schema<T>` accepts — so these shim types are assignable to `Schema<T>`.
 */

/* eslint-disable @typescript-eslint/no-namespace */

type Validate<O> = (value: unknown) => { value: O; issues?: undefined } | { value?: undefined; issues: { message: string }[] };

class ZodType<Output> {
	declare readonly _output: Output;

	readonly '~standard': {
		version: 1;
		vendor: 'zod';
		validate: Validate<Output>;
		types?: { input: Output; output: Output };
	};

	constructor(validate: Validate<Output>) {
		this['~standard'] = { version: 1, vendor: 'zod', validate };
	}

	parse(value: unknown): Output {
		const result = this['~standard'].validate(value);
		if (result.issues) {
			throw new Error(result.issues.map((i) => i.message).join('; '));
		}
		return result.value;
	}

	optional(): ZodType<Output | undefined> {
		const inner = this['~standard'].validate;
		return new ZodType<Output | undefined>((v) => (v === undefined ? { value: undefined } : inner(v)));
	}

	nullable(): ZodType<Output | null> {
		const inner = this['~standard'].validate;
		return new ZodType<Output | null>((v) => (v === null ? { value: null } : inner(v)));
	}

	default(fallback: Output): ZodType<Output> {
		const inner = this['~standard'].validate;
		return new ZodType<Output>((v) => (v === undefined ? { value: fallback } : inner(v)));
	}

	describe(_description: string): this {
		return this;
	}

	min(_n: number): this {
		return this;
	}

	max(_n: number): this {
		return this;
	}
}

type Shape = Record<string, ZodType<any>>;
type InferShape<S extends Shape> = { [K in keyof S]: S[K]['_output'] };

function primitive<O>(name: string, ok: (v: unknown) => v is O): () => ZodType<O> {
	return () =>
		new ZodType<O>((v) => (ok(v) ? { value: v } : { issues: [{ message: `expected ${name}` }] }));
}

export namespace z {
	export type infer<T extends ZodType<any>> = T['_output'];
	export type ZodTypeAny = ZodType<any>;

	export const string = primitive<string>('string', (v): v is string => typeof v === 'string');
	export const number = primitive<number>('number', (v): v is number => typeof v === 'number');
	export const boolean = primitive<boolean>('boolean', (v): v is boolean => typeof v === 'boolean');
	export const date = primitive<Date>('date', (v): v is Date => v instanceof Date);

	export function unknown(): ZodType<unknown> {
		return new ZodType<unknown>((v) => ({ value: v }));
	}
	export function any(): ZodType<any> {
		return new ZodType<any>((v) => ({ value: v }));
	}

	export function literal<const T extends string | number | boolean>(value: T): ZodType<T> {
		return new ZodType<T>((v) => (v === value ? { value: value } : { issues: [{ message: `expected ${String(value)}` }] }));
	}

	export function array<T>(item: ZodType<T>): ZodType<T[]> {
		return new ZodType<T[]>((v) => {
			if (!Array.isArray(v)) return { issues: [{ message: 'expected array' }] };
			const out: T[] = [];
			for (const el of v) {
				const r = item['~standard'].validate(el);
				if (r.issues) return { issues: r.issues };
				out.push(r.value);
			}
			return { value: out };
		});
	}

	export function record<V>(value: ZodType<V>): ZodType<Record<string, V>> {
		return new ZodType<Record<string, V>>((v) => {
			if (typeof v !== 'object' || v === null) return { issues: [{ message: 'expected object' }] };
			const out: Record<string, V> = {};
			for (const [k, el] of Object.entries(v)) {
				const r = value['~standard'].validate(el);
				if (r.issues) return { issues: r.issues };
				out[k] = r.value;
			}
			return { value: out };
		});
	}

	export function object<S extends Shape>(shape: S): ZodType<InferShape<S>> {
		return new ZodType<InferShape<S>>((v) => {
			if (typeof v !== 'object' || v === null) return { issues: [{ message: 'expected object' }] };
			const record = v as Record<string, unknown>;
			const out: Record<string, unknown> = {};
			for (const key of Object.keys(shape)) {
				const r = shape[key]!['~standard'].validate(record[key]);
				if (r.issues) return { issues: r.issues.map((i) => ({ message: `${key}: ${i.message}` })) };
				out[key] = r.value;
			}
			return { value: out as InferShape<S> };
		});
	}
}
