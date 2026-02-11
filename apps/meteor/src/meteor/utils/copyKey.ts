export function copyKey<T>(key: PropertyKey, target: T, source: PropertyDescriptor & ThisType<any>) {
	const desc = Object.getOwnPropertyDescriptor(source, key);
	Object.defineProperty(target, key, { ...desc, configurable: true });
}
