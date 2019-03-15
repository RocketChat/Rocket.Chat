import Future from 'fibers/future';
import { UploadFS } from 'meteor/jalik:ufs';

export const Sandstorm = {};

export let getHttpBridge;
export let waitPromise;

if (process.env.SANDSTORM === '1') {
	const Capnp = require('capnp');
	const { SandstormHttpBridge } = Capnp.importSystem('sandstorm/sandstorm-http-bridge.capnp');

	let capnpConnection = null;
	let httpBridge = null;

	getHttpBridge = function() {
		if (!httpBridge) {
			capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');
			httpBridge = capnpConnection.restore(null, SandstormHttpBridge);
		}
		return httpBridge;
	};

	const promiseToFuture = function(promise) {
		const result = new Future();
		promise.then(result.return.bind(result), result.throw.bind(result));
		return result;
	};

	waitPromise = function(promise) {
		return promiseToFuture(promise).wait();
	};

	// This usual implementation of this method returns an absolute URL that is invalid
	// under Sandstorm.
	UploadFS.Store.prototype.getURL = function(path) {
		return this.getRelativeURL(path);
	};
}
