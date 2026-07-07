import * as z from 'zod';

/**
 * A declarative field map: keys are the Apps-Engine (target) property names, values are the
 * Rocket.Chat (source) property names. This mirrors the "string" entries of the legacy
 * `transformMappedData` map.
 */
export type FieldMap = Record<string, string>;

type Loose = Record<string, any>;

/**
 * Builds a Zod codec from a plain string field map, reproducing the behaviour of the legacy
 * `transformMappedData` helper for the common "rename these fields, bucket the rest" case:
 *
 * - `decode` (Rocket.Chat -> Apps-Engine): deep-clones the input (so the app can never mutate the
 *   stored document), copies each mapped source field to its target name when defined, and collects
 *   every remaining property into `_unmappedProperties_`.
 * - `encode` (Apps-Engine -> Rocket.Chat): applies the inverse rename and merges
 *   `_unmappedProperties_` back onto the result, matching the hand-written reverse converters.
 *
 * The endpoints are typed with `z.custom` so no runtime validation is added yet (behaviour-preserving);
 * schemas can be tightened later without changing the transform logic.
 */
export function createMappedCodec(fieldMap: FieldMap) {
	const appKeys = Object.keys(fieldMap);

	return z.codec(z.custom<Loose>(), z.custom<Loose>(), {
		decode: (data: Loose): Loose => {
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
		},
		encode: (app: Loose): Loose => {
			const { _unmappedProperties_ = {}, ...rest } = app;
			const result: Loose = {};

			for (const appKey of appKeys) {
				if (typeof rest[appKey] !== 'undefined') {
					result[fieldMap[appKey]] = rest[appKey];
				}
			}

			return { ...result, ..._unmappedProperties_ };
		},
	});
}
