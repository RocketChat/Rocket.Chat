/**
 * Schema contract for the App SDK.
 *
 * The SDK is **schema-first**: every boundary an app declares (slash-command
 * arguments, settings, HTTP bodies, persisted records, modal state) is described
 * by a schema. The runtime validates untrusted input against it *before* your
 * code runs, and the static type of your handler payloads is *inferred* from it.
 *
 * We deliberately depend only on the [Standard Schema](https://standardschema.dev)
 * contract rather than a concrete validation library. Zod v4, Valibot and ArkType
 * all implement it, so apps bring the validator they like. Every example in this
 * proposal uses Zod, because that is what the ecosystem (and Mastra) reach for:
 *
 * ```ts
 * import { z } from 'zod';
 * const args = z.object({ target: z.string(), loud: z.boolean().default(false) });
 * ```
 *
 * Mastra models schemas exactly this way (`StandardSchemaWithJSON` in
 * `@mastra/core/schema`); we follow it so the platform can also emit JSON Schema
 * for docs, admin UIs and cross-process (NATS) validation.
 */

/** The subset of the Standard Schema v1 spec the SDK relies on. */
export interface StandardSchemaV1<Output = unknown, Input = Output> {
	readonly '~standard': {
		readonly version: 1;
		readonly vendor: string;
		readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>;
		readonly types?: { readonly input: Input; readonly output: Output };
	};
}

export type StandardResult<Output> = { value: Output; issues?: undefined } | { value?: undefined; issues: ReadonlyArray<StandardIssue> };

export interface StandardIssue {
	readonly message: string;
	readonly path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
}

/**
 * A schema the SDK accepts anywhere validation is declared. It is a Standard
 * Schema that additionally *may* expose a JSON Schema (Zod v4 does via
 * `z.toJSONSchema`), which the platform uses to render admin forms and to
 * validate payloads that cross the app-runtime boundary.
 */
export type Schema<Output = unknown> = StandardSchemaV1<Output> & {
	/**
	 * Phantom output-type carrier. Zod v4 exposes this (`_output`); it is the
	 * reliable inference target. Inferring the output from `~standard.validate`'s
	 * return instead folds in `undefined` (its failure branch has `value?:
	 * undefined`), so `Infer` reads this phantom, never the validator.
	 */
	readonly _output?: Output;
	/** Optional JSON Schema projection, when the validator can produce one. */
	readonly toJsonSchema?: () => unknown;
};

/** True only for the `any` type. Used to keep `<..., any>` registration arrays permissive. */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/** Infer the output (parsed) type of a schema, via its phantom output carrier. */
export type Infer<S> = S extends { readonly _output?: infer O } ? O : never;

/**
 * Infer a handler payload type from an *optional* schema generic.
 *
 * Factories declare their schema as an optional property (`arguments?`, `body?`,
 * `inputSchema?`); an absent schema yields `Fallback`, a present one its parsed
 * output. `[A] extends [undefined]` distinguishes the two without letting an
 * optional property fold `undefined` into the result.
 */
export type InferArg<A, Fallback> = IsAny<A> extends true ? any : [A] extends [undefined] ? Fallback : Infer<NonNullable<A>>;
