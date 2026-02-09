type HasOwn<TObject extends Record<PropertyKey, unknown>, TKey extends PropertyKey> = TObject & { [K in TKey]-?: TObject[K] };

export const hasOwn = <TObject extends Record<PropertyKey, unknown>, TKey extends PropertyKey>(
	object: TObject,
	property: TKey,
): object is HasOwn<TObject, TKey> => Object.hasOwn(object, property);
