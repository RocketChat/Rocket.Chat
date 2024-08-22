if (!Promise.prototype.finally) {
	// eslint-disable-next-line no-extend-native
	Promise.prototype.finally = function (callback) {
		if (typeof callback !== 'function') {
			return this.then(callback, callback);
		}
		const P = (this.constructor as PromiseConstructor) || Promise;
		return this.then(
			(value) => P.resolve(callback()).then(() => value),
			(err) =>
				P.resolve(callback()).then(() => {
					throw err;
				}),
		);
	};
}
