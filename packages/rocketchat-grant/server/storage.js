export class Storage {
	constructor() {
		this._data = {};
	}

	all() {
		return this._data;
	}

	forEach(fn) {
		Object.keys(this.all())
			.forEach((name) => {
				fn(this.get(name), name);
			});
	}

	get(name) {
		return this.all()[name.toLowerCase()];
	}

	has(name) {
		return !!this._data[name];
	}

	_add(name, body) {
		if (this.has(name)) {
			console.error(`'${ name }' have been already defined`);
			return;
		}

		this._data[name] = body;
	}
}
