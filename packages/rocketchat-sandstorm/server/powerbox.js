/* globals getHttpBridge, waitPromise */

RocketChat.Sandstorm.offerUiView = function() {};

if (process.env.SANDSTORM === '1') {
	const Capnp = Npm.require('capnp');
	const Powerbox = Npm.require('sandstorm/powerbox.capnp');
	const Grain = Npm.require('sandstorm/grain.capnp');

	RocketChat.Sandstorm.offerUiView = function(token, serializedDescriptor, sessionId) {
		const httpBridge = getHttpBridge();
		const session = httpBridge.getSessionContext(sessionId).context;
		const api = httpBridge.getSandstormApi(sessionId).api;
		const cap = waitPromise(api.restore(new Buffer(token, 'base64'))).cap;
		return waitPromise(session.offer(cap, undefined, {tags: [{
			id: '15831515641881813735',
			value: new Buffer(serializedDescriptor, 'base64')
		}]}));
	};

	Meteor.methods({
		sandstormClaimRequest(token, serializedDescriptor) {
			const descriptor = Capnp.parsePacked(Powerbox.PowerboxDescriptor, new Buffer(serializedDescriptor, 'base64'));
			const grainTitle = Capnp.parse(Grain.UiView.PowerboxTag, descriptor.tags[0].value).title;
			const sessionId = this.connection.sandstormSessionId();
			const httpBridge = getHttpBridge();
			const session = httpBridge.getSessionContext(sessionId).context;
			const cap = waitPromise(session.claimRequest(token)).cap.castAs(Grain.UiView);
			const api = httpBridge.getSandstormApi(sessionId).api;
			const newToken = waitPromise(api.save(cap)).token.toString('base64');
			const viewInfo = waitPromise(cap.getViewInfo());
			const appTitle = viewInfo.appTitle;
			const asset = waitPromise(viewInfo.grainIcon.getUrl());
			const appIconUrl = `${ asset.protocol }://${ asset.hostPath }`;
			return {
				token: newToken,
				appTitle,
				appIconUrl,
				grainTitle,
				descriptor: descriptor.tags[0].value.toString('base64')
			};
		},
		sandstormOffer(token, serializedDescriptor) {
			RocketChat.Sandstorm.offerUiView(token, serializedDescriptor,
				this.connection.sandstormSessionId());
		}
	});
}
