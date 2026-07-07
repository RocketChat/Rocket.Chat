import * as z from 'zod';

/**
 * A declarative field map: keys are the Apps-Engine (target) property names, values are the
 * Rocket.Chat (source) property names. This mirrors the "string" entries of the legacy
 * `transformMappedData` map.
 */
export type FieldMap = Record<string, string>;

type Loose = Record<string, any>;

/**
 * The Rocket.Chat -> Apps-Engine transform for a plain string field map, reproducing the behaviour
 * of the legacy `transformMappedData` for the common "rename these fields, bucket the rest" case:
 * the input is deep-cloned (so the app can never mutate the stored document), each mapped source
 * field is copied to its target name when defined, and every remaining property is collected into
 * `_unmappedProperties_`.
 */
export function mappedDecode(fieldMap: FieldMap): (data: Loose) => Loose {
	const appKeys = Object.keys(fieldMap);

	return (data: Loose): Loose => {
		const clone: Loose = structuredClone(data);
		const result: Loose = {};

		for (const appKey of appKeys) {
			const sourceKey = fieldMap[appKey];

			if (typeof clone[sourceKey] !== 'undefined') {
				result[appKey] = clone[sourceKey];
			}

			delete clone[sourceKey];
		}

		result._unmappedProperties_ = clone;

		return result;
	};
}

/**
 * The Apps-Engine -> Rocket.Chat transform for a plain string field map: the inverse rename (target
 * fields copied back to their source names when defined) with `_unmappedProperties_` merged onto the
 * result. This is the symmetric counterpart to {@link mappedDecode}; converters whose reverse
 * direction has defaults, conditional fields or asymmetric mappings provide their own `encode`.
 */
export function mappedEncode(fieldMap: FieldMap): (app: Loose) => Loose {
	const appKeys = Object.keys(fieldMap);

	return (app: Loose): Loose => {
		const { _unmappedProperties_ = {}, ...rest } = app;
		const result: Loose = {};

		for (const appKey of appKeys) {
			if (typeof rest[appKey] !== 'undefined') {
				result[fieldMap[appKey]] = rest[appKey];
			}
		}

		return { ...result, ..._unmappedProperties_ };
	};
}

/**
 * Builds a Zod codec from a plain string field map, using {@link mappedDecode} / {@link mappedEncode}.
 *
 * The endpoints are typed with `z.custom` so no runtime validation is added yet (behaviour-preserving);
 * schemas can be tightened later without changing the transform logic.
 */
export function createMappedCodec(fieldMap: FieldMap) {
	return z.codec(z.custom<Loose>(), z.custom<Loose>(), {
		decode: mappedDecode(fieldMap),
		encode: mappedEncode(fieldMap),
	});
}
