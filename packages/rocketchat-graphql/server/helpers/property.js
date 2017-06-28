export function property(key) {
	return (object) => object == null ? undefined : object[key];
}
