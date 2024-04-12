import { Tracker } from 'meteor/tracker';

export class ClientVersions {
	constructor() {
		this._versions = new Map();
		this._watchCallbacks = new Set();
	}

	// Creates a Livedata store for use with `Meteor.connection.registerStore`.
	// After the store is registered, document updates reported by Livedata are
	// merged with the documents in this `ClientVersions` instance.
	createStore() {
		return {
			update: ({ id, msg, fields }) => {
				if (msg === 'added' || msg === 'changed') {
					this.set(id, fields);
				}
			},
		};
	}

	hasVersions() {
		return this._versions.size > 0;
	}

	get(id) {
		return this._versions.get(id);
	}

	// Adds or updates a version document and invokes registered callbacks for the
	// added/updated document. If a document with the given ID already exists, its
	// fields are merged with `fields`.
	set(id, fields) {
		let version = this._versions.get(id);
		let isNew = false;

		if (version) {
			Object.assign(version, fields);
		} else {
			version = {
				_id: id,
				...fields,
			};

			isNew = true;
			this._versions.set(id, version);
		}

		this._watchCallbacks.forEach(({ fn, filter }) => {
			if (!filter || filter === version._id) {
				fn(version, isNew);
			}
		});
	}

	// Registers a callback that will be invoked when a version document is added
	// or changed. Calling the function returned by `watch` removes the callback.
	// If `skipInitial` is true, the callback isn't be invoked for existing
	// documents. If `filter` is set, the callback is only invoked for documents
	// with ID `filter`.
	watch(fn, { skipInitial, filter } = {}) {
		if (!skipInitial) {
			const resolved = Promise.resolve();

			this._versions.forEach((version) => {
				if (!filter || filter === version._id) {
					resolved.then(() => fn(version, true));
				}
			});
		}

		const callback = { fn, filter };
		this._watchCallbacks.add(callback);

		return () => this._watchCallbacks.delete(callback);
	}

	// A reactive data source for `Autoupdate.newClientAvailable`.
	newClientAvailable(id, fields, currentVersion) {
		function isNewVersion(version) {
			return version._id === id && fields.some((field) => version[field] !== currentVersion[field]);
		}

		const dependency = new Tracker.Dependency();
		const version = this.get(id);

		dependency.depend();

		const stop = this.watch(
			(version) => {
				if (isNewVersion(version)) {
					dependency.changed();
					stop();
				}
			},
			{ skipInitial: true },
		);

		return !!version && isNewVersion(version);
	}
}
