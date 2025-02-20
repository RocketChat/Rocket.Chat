/**
 * Transforms a `data` source object to another object,
 * essentially applying a to -> from mapping provided by
 * `map`. It does not mutate the `data` object.
 *
 * It also inserts in the `transformedObject` a new property
 * called `_unmappedProperties_` which contains properties from
 * the original `data` that have not been mapped to its transformed
 * counterpart. E.g.:
 *
 * ```javascript
 * const data = { _id: 'abcde123456', size: 10 };
 * const map = Object.freeze({ id: '_id' });
 *
 * transformMappedData(data, map);
 * // { id: 'abcde123456', _unmappedProperties_: { size: 10 } }
 * ```
 *
 * In order to compute the unmapped properties, this function will
 * ignore any property on `data` that has been named on the "from" part
 * of the `map`, and will consider properties not mentioned as unmapped.
 *
 * You can also define the "from" part as a function, so you can derive a
 * new value for your property from the original `data`. This function will
 * receive a copy of the original `data` for it to calculate the value
 * for its "to" field. Please note that in this case `transformMappedData`
 * will not be able to determine the source field from your map, so it won't
 * ignore any field you've used to derive your new value. For that, you're
 * going to need to delete the value from the received parameter. E.g:
 *
 * ```javascript
 * const data = { _id: 'abcde123456', size: 10 };
 *
 * // It will look like the `size` property is not mapped
 * const map = {
 *     id: '_id',
 *     newSize: (data) => data.size + 10
 * };
 *
 * transformMappedData(data, map);
 * // { id: 'abcde123456', newSize: 20, _unmappedProperties_: { size: 10 } }
 *
 * // You need to explicitly remove it from the original `data`
 * const map = Object.freeze({
 *     id: '_id',
 *     newSize: (data) => {
 *         const result = data.size + 10;
 *         delete data.size;
 *         return result;
 *     }
 * });
 *
 * transformMappedData(data, map);
 * // { id: 'abcde123456', newSize: 20, _unmappedProperties_: {} }
 * ```
 *
 * @param Object data The data to be transformed
 * @param Object map The map with transformations to be applied
 *
 * @returns Object The data after transformations have been applied
 */

type MapFor<DataType> = {
	[p in string]:
		| string
		| ((data: DataType) => Promise<unknown>)
		| ((data: DataType) => unknown)
		| { from: string; list: true }
		| { from: string; map: MapFor<DataType[keyof DataType]>; list?: boolean };
};

type ResultFor<DataType extends Record<string, any>, MapType extends MapFor<DataType>> = {
	-readonly [p in keyof MapType]: MapType[p] extends keyof DataType
		? DataType[MapType[p]]
		: MapType[p] extends (...args: any[]) => any
			? Awaited<ReturnType<MapType[p]>>
			: MapType[p] extends { from: infer KeyName; map?: Record<string, any>; list?: boolean }
				? KeyName extends keyof DataType
					? MapType[p]['list'] extends true
						? DataType[KeyName] extends any[]
							? MapType[p]['map'] extends MapFor<DataType[KeyName][number]>
								? ResultFor<DataType[KeyName][number], MapType[p]['map']>[]
								: DataType[KeyName]
							: DataType[KeyName][]
						: DataType[KeyName] extends object
							? MapType[p]['map'] extends MapFor<DataType[KeyName]>
								? ResultFor<DataType[KeyName], MapType[p]['map']>
								: never
							: never
					: never
				: never;
};

export const transformMappedData = async <
	ResultType extends ResultFor<DataType, MapType>,
	DataType extends Record<string, any>,
	MapType extends MapFor<DataType>,
	UnmappedProperties extends {
		[p in keyof DataType as Exclude<p, MapType[keyof MapType]>]: DataType[p];
	},
>(
	data: DataType,
	map: MapType,
): Promise<ResultType & { _unmappedProperties_: UnmappedProperties }> => {
	const originalData: DataType = structuredClone(data);
	const transformedData: Record<string, any> = {};

	for await (const [to, from] of Object.entries(map)) {
		if (typeof from === 'function') {
			const result = await from(originalData);

			if (typeof result !== 'undefined') {
				transformedData[to] = result;
			}
		} else if (typeof from === 'string') {
			if (typeof originalData[from] !== 'undefined') {
				transformedData[to] = originalData[from];
			}
			delete originalData[from];
		} else if (typeof from === 'object' && 'from' in from) {
			const { from: fromName } = from;

			if (from.list) {
				if (Array.isArray(originalData[fromName])) {
					if ('map' in from && from.map) {
						if (typeof originalData[fromName] === 'object') {
							transformedData[to] = await Promise.all(originalData[fromName].map((item) => transformMappedData(item, from.map)));
						}
					} else {
						transformedData[to] = [...originalData[fromName]];
					}
				} else if (originalData[fromName] !== undefined && originalData[fromName] !== null) {
					transformedData[to] = [originalData[fromName]];
				}
			} else {
				transformedData[to] = await transformMappedData(originalData[fromName], from.map);
			}

			delete originalData[fromName];
		}
	}

	return {
		...(transformedData as ResultType),
		_unmappedProperties_: originalData as unknown as UnmappedProperties,
	};
};
