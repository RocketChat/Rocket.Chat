export function objectMap<TObject extends Record<string, any> = Record<string, any>, K extends keyof TObject | string = keyof TObject>(
	object: TObject,
	cb: (value: { key: K; value: TObject[K] }) => { key: string | number | symbol; value: any } | undefined,
	recursive?: false,
): Record<string, any>;
export function objectMap<TObject extends Record<string, any> = Record<string, any>>(
	object: TObject,
	cb: (value: { key: string | number | symbol; value: any }) => { key: string | number | symbol; value: any } | undefined,
	recursive: true,
): Record<string, any>;
export function objectMap<TObject extends Record<string, any> = Record<string, any>, K extends keyof TObject | string = keyof TObject>(
	object: TObject,
	cb: (value: { key: K; value: any }) => { key: string | number | symbol; value: any } | undefined,
	recursive: false,
): Record<string, any>;
export function objectMap<TObject extends Record<string, any> = Record<string, any>, K extends keyof TObject | string = keyof TObject>(
	object: TObject,
	cb: (value: { key: K | string; value: any }) => { key: string | number | symbol; value: any } | undefined,
	recursive = false,
): Record<string, any> {
	return Object.fromEntries(
		Object.keys(object)
			.map((key) => {
				const value = object[key as K];
				if (recursive && value && typeof value === 'object' && !Array.isArray(value) && !((value as any) instanceof Date)) {
					const newValue = objectMap(value, cb as any, true);
					return cb({ key, value: newValue });
				}

				return cb({ key, value });
			})
			.filter((item) => !!item)
			.map((item) => [item.key, item.value]),
	);
}
