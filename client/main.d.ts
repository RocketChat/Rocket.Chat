/* eslint-disable @typescript-eslint/interface-name-prefix */

declare module 'meteor/reactive-dict' {
	const ReactiveDict: ReactiveDictStatic;
	interface ReactiveDictStatic {
		new <T>(name: string, initialValue?: T): ReactiveDict<T>;
	}
	interface ReactiveDict<T> {
		get(name: string): T;
		set(name: string, newValue: T): void;
	}
}
