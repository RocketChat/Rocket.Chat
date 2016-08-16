/* globals getHttpBridge, waitPromise */

RocketChat.Sandstorm.offerUiView = function() {};

if (process.env.SANDSTORM === '1') {
	var Capnp = Npm.require('capnp');
	var Powerbox = Npm.require('sandstorm/powerbox.capnp');
	var Grain = Npm.require('sandstorm/grain.capnp');

	RocketChat.Sandstorm.offerUiView = function(token, sessionId) {
		var httpBridge = getHttpBridge();
		var session = httpBridge.getSessionContext(sessionId).context;
		var api = httpBridge.getSandstormApi(sessionId).api;
		var cap = waitPromise(api.restore(new Buffer(token, 'base64'))).cap;
		return waitPromise(session.offer(cap, undefined, {tags: [{id: '15831515641881813735'}]}));
	};

	Meteor.methods({
		sandstormClaimRequest: function(token, seriliazedDescriptor) {
			var descriptor = Capnp.parsePacked(Powerbox.PowerboxDescriptor, new Buffer(seriliazedDescriptor, 'base64'));
			var grainTitle = Capnp.parse(Grain.UiView.PowerboxTag, descriptor.tags[0].value).title;
			var sessionId = this.connection.sandstormSessionId();
			var httpBridge = getHttpBridge();
			var session = httpBridge.getSessionContext(sessionId).context;
			var cap = waitPromise(session.claimRequest(token)).cap.castAs(Grain.UiView);
			var api = httpBridge.getSandstormApi(sessionId).api;
			var newToken = waitPromise(api.save(cap)).token.toString('base64');
			var viewInfo = waitPromise(cap.getViewInfo());
			var appTitle = viewInfo.appTitle;
			var asset = waitPromise(viewInfo.grainIcon.getUrl());
			var appIconUrl = asset.protocol + '://' + asset.hostPath;
			return {
				token: newToken,
				appTitle: appTitle,
				appIconUrl: appIconUrl,
				grainTitle: grainTitle
			};
		},
		sandstormOffer: function(token) {
			RocketChat.Sandstorm.offerUiView(token, this.connection.sandstormSessionId());
		}
	});
}
