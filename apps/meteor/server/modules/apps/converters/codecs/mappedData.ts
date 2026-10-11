import * as z from 'zod';

type Loose = Record<string, any>;

/**
 * A declarative field map from Apps-Engine (target) property names to Rocket.Chat (source) property
 * names. Values are constrained to the keys of `Source`, so mapping a renamed or misspelled source
 * field is a compile error.
 */
export type FieldMap<Source> = Record<string, Extract<keyof Source, string>>;

/**
 * The Rocket.Chat -> Apps-Engine result of decoding `Source` through `Map`: each target property
 * holds its source value (optional, since it is only set when the source value is defined), and
 * everything the map did not name is collected under `_unmappedProperties_`.
 */
export type Decoded<Source, Map extends FieldMap<Source>> = {
	-readonly [Target in keyof Map]?: Source[Map[Target]];
} & {
	_unmappedProperties_: Omit<Source, Map[keyof Map]>;
};

/**
 * Rocket.Chat -> Apps-Engine transform for a plain string field map, reproducing the "rename these
 * fields, bucket the rest" behaviour of the original mapping helper: the input is deep-cloned (so the
 * app can never mutate the stored document), each mapped source field is copied to its target name
 * when defined, and every remaining property is collected into `_unmappedProperties_`.
 */
export function mappedDecode<Source extends Loose = Loose, const Map extends FieldMap<Source> = FieldMap<Source>>(
	fieldMap: Map,
): (data: Source) => Decoded<Source, Map> {
	const entries = Object.entries(fieldMap) as [string, string][];

	return (data: Source): Decoded<Source, Map> => {
		const clone: Loose = structuredClone(data);
		const result: Loose = {};

		for (const [target, sourceKey] of entries) {
			if (typeof clone[sourceKey] !== 'undefined') {
				result[target] = clone[sourceKey];
			}

			delete clone[sourceKey];
		}

		result._unmappedProperties_ = clone;

		return result as Decoded<Source, Map>;
	};
}

/**
 * The Apps-Engine -> Rocket.Chat inverse of {@link mappedDecode}: target fields are copied back to
 * their source names when defined and `_unmappedProperties_` is merged onto the result. Because both
 * the renamed keys and the bucket originate from `Source`, the result is a `Partial<Source>`.
 *
 * This is the symmetric counterpart to {@link mappedDecode}; converters whose reverse direction has
 * defaults, conditional fields or asymmetric mappings provide their own `encode`.
 */
export function mappedEncode<Source extends Loose = Loose, const Map extends FieldMap<Source> = FieldMap<Source>>(
	fieldMap: Map,
): (app: Decoded<Source, Map>) => Partial<Source> {
	const entries = Object.entries(fieldMap) as [string, string][];

	return (app: Decoded<Source, Map>): Partial<Source> => {
		const { _unmappedProperties_ = {}, ...rest } = app as Loose;
		const result: Loose = {};

		for (const [target, sourceKey] of entries) {
			if (typeof rest[target] !== 'undefined') {
				result[sourceKey] = rest[target];
			}
		}

		return { ...result, ..._unmappedProperties_ } as Partial<Source>;
	};
}

/**
 * A map whose entries are one of the three forms the original mapping helper supports: a source
 * property name (string), a function that derives the target value from the (cloned) source data,
 * or a nested `{ from, map, list }` descriptor for sub-objects and arrays.
 *
 * Unlike {@link FieldMap}, this is intentionally loosely typed: its consumers (rooms, messages,
 * uploads) map many optional/livechat-only fields that are not part of the base document types.
 */
export type AsyncFieldMap = Record<
	string,
	string | ((data: Record<string, any>) => unknown | Promise<unknown>) | { from: string; map?: AsyncFieldMap; list?: boolean }
>;

/**
 * Rocket.Chat -> Apps-Engine transform for a map mixing string renames, (possibly async) derived-value
 * functions and nested `{ from, map, list }` descriptors, reproducing the original mapping helper
 * exactly:
 *
 * - the input is deep-cloned up front, so functions may freely mutate the clone (e.g. `delete` fields
 *   they consume) and the app can never mutate the stored document;
 * - string entries copy the source field to the target name when defined and always drop the source
 *   key from the bucket;
 * - function entries receive the clone and set the target only when they return a defined value
 *   (functions are responsible for deleting any source keys they consume);
 * - nested entries recurse when they carry a `map` (producing a `_unmappedProperties_` bucket at each
 *   level) or copy the cloned source value verbatim when they do not, and `list` entries map arrays
 *   element-by-element (or wrap a lone value into a single-element array);
 * - absent (`undefined`/`null`) nested sources are skipped, so the target stays unset;
 * - everything left in the clone becomes `_unmappedProperties_`.
 *
 * The result shape is caller-asserted via the `Result` type parameter, since it depends on the map's
 * function/nested entries in ways that are not worth expressing in the type system.
 *
 * `dropUnmapped` omits the `_unmappedProperties_` bucket at the root and every nested level, for
 * callers (e.g. contacts) that map every attribute individually and must not let extra app data leak
 * through. It defaults to `false`, preserving the "bucket the rest" behaviour for other callers.
 */
export async function mappedDecodeAsync<Result = Loose>(
	data: Loose,
	map: AsyncFieldMap,
	options: { dropUnmapped?: boolean } = {},
): Promise<Result> {
	const clone: Loose = structuredClone(data);
	const result: Loose = {};

	for (const [to, from] of Object.entries(map)) {
		if (typeof from === 'function') {
			const value = await from(clone);

			if (typeof value !== 'undefined') {
				result[to] = value;
			}
		} else if (typeof from === 'string') {
			if (typeof clone[from] !== 'undefined') {
				result[to] = clone[from];
			}

			delete clone[from];
		} else {
			const { from: fromName } = from;

			if (from.list) {
				if (Array.isArray(clone[fromName])) {
					if ('map' in from && from.map) {
						result[to] = await Promise.all(
							clone[fromName].map((item: Loose) => mappedDecodeAsync(item, from.map as AsyncFieldMap, options)),
						);
					} else {
						result[to] = [...clone[fromName]];
					}
				} else if (clone[fromName] !== undefined && clone[fromName] !== null) {
					result[to] = [clone[fromName]];
				}
			} else if (clone[fromName] !== undefined && clone[fromName] !== null) {
				result[to] = from.map
					? await mappedDecodeAsync(clone[fromName], from.map as AsyncFieldMap, options)
					: structuredClone(clone[fromName]);
			}

			delete clone[fromName];
		}
	}

	if (!options.dropUnmapped) {
		result._unmappedProperties_ = clone;
	}

	return result as Result;
}

/**
 * Builds a Zod codec from a plain string field map, using {@link mappedDecode} / {@link mappedEncode}.
 * `decode` produces {@link Decoded}; `encode` is its inverse.
 *
 * The endpoints are typed with `z.custom` so no runtime validation is added yet (behaviour-preserving);
 * schemas can be tightened later without changing the transform logic.
 */
export function createMappedCodec<Source extends Loose = Loose, const Map extends FieldMap<Source> = FieldMap<Source>>(fieldMap: Map) {
	return z.codec(z.custom<Source>(), z.custom<Decoded<Source, Map>>(), {
		decode: mappedDecode<Source, Map>(fieldMap),
		encode: (app) => mappedEncode<Source, Map>(fieldMap)(app) as Source,
	});
}
