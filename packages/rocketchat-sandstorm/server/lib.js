/* globals getHttpBridge, waitPromise */
/* exported getHttpBridge, waitPromise */

RocketChat.Sandstorm = {};

if (process.env.SANDSTORM === '1') {
	var Future = Npm.require('fibers/future');
	var Capnp = Npm.require('capnp');
	var SandstormHttpBridge = Npm.require('sandstorm/sandstorm-http-bridge.capnp').SandstormHttpBridge;

	var capnpConnection = null;
	var httpBridge = null;

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
}
