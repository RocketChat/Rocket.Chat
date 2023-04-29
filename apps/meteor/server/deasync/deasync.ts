import deasync from 'deasync';

const deasyncPromise = function (promise: Promise<any>) {
	return deasync((cb) => {
		promise
			.then((r) => {
				cb(undefined, r);
			})
			.catch((e) => {
				cb(e, undefined);
			});
	})();
};

export { deasyncPromise, deasync };
