export class MongoID {
	static idStringify(id: unknown): string {
		if (typeof id === 'string') {
			const firstChar = id.charAt(0);
			if (id === '') {
				return id;
			}
			if (
				firstChar === '-' || // escape previously dashed strings
				firstChar === '~' || // escape escaped numbers, true, false
				firstChar === '{'
			) {
				// escape object-form strings, for maybe implementing later
				return `-${id}`;
			}
			return id; // other strings go through unchanged.
		}
		if (id === undefined) {
			return '-';
		}
		if (typeof id === 'object' && id !== null) {
			throw new Error('Meteor does not currently support objects other than ObjectID as ids');
		} else {
			// Numbers, true, false, null
			return `~${JSON.stringify(id)}`;
		}
	}

	static idParse(id: string): unknown {
		const firstChar = id.charAt(0);
		if (id === '') {
			return id;
		}
		if (id === '-') {
			return undefined;
		}
		if (firstChar === '-') {
			return id.slice(1);
		}
		if (firstChar === '~') {
			return JSON.parse(id.slice(1));
		}
		return id;
	}
}
