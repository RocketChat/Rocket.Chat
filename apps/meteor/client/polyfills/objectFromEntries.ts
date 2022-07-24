Object.fromEntries =
	Object.fromEntries ||
	function fromEntries<T>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T } {
		return [...entries].reduce((obj, { 0: key, 1: val }) => Object.assign(obj, { [key]: val }), {});
	};
