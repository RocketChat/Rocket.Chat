/* eslint-disable @typescript-eslint/ban-types -- We need the generic Function type here */

export type Serialized<T> = T extends Date
	? Exclude<T, Date> | string
	: T extends Function
	? never
	: T extends boolean | number | string | null | undefined | Buffer
	? T
	: T extends {}
	? {
			[K in keyof T]: Serialized<T[K]>;
	  }
	: never;
