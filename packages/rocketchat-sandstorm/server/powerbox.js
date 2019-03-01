import { Meteor } from 'meteor/meteor';
import { Sandstorm } from './lib';
import { getHttpBridge, waitPromise } from './lib';

Sandstorm.offerUiView = function() {};

if (process.env.SANDSTORM === '1') {
	const Capnp = require('capnp');
	const Powerbox = Capnp.importSystem('sandstorm/powerbox.capnp');
	const Grain = Capnp.importSystem('sandstorm/grain.capnp');

	Sandstorm.offerUiView = function(token, serializedDescriptor, sessionId) {
		const httpBridge = getHttpBridge();
		const session = httpBridge.getSessionContext(sessionId).context;
		const { api } = httpBridge.getSandstormApi(sessionId);
		const { cap } = waitPromise(api.restore(new Buffer(token, 'base64')));
		return waitPromise(session.offer(cap, undefined, { tags: [{
			id: '15831515641881813735',
			value: new Buffer(serializedDescriptor, 'base64'),
		}] }));
	};

	Meteor.methods({
		sandstormClaimRequest(token, serializedDescriptor) {
			const descriptor = Capnp.parsePacked(Powerbox.PowerboxDescriptor, new Buffer(serializedDescriptor, 'base64'));
			const grainTitle = Capnp.parse(Grain.UiView.PowerboxTag, descriptor.tags[0].value).title;
			const sessionId = this.connection.sandstormSessionId();
			const httpBridge = getHttpBridge();
			const session = httpBridge.getSessionContext(sessionId).context;
			const cap = waitPromise(session.claimRequest(token)).cap.castAs(Grain.UiView);
			const { api } = httpBridge.getSandstormApi(sessionId);
			const newToken = waitPromise(api.save(cap)).token.toString('base64');
			const viewInfo = waitPromise(cap.getViewInfo());
			const { appTitle } = viewInfo;
			const asset = waitPromise(viewInfo.grainIcon.getUrl());
			const appIconUrl = `${ asset.protocol }://${ asset.hostPath }`;
			return {
				token: newToken,
				appTitle,
				appIconUrl,
				grainTitle,
				descriptor: descriptor.tags[0].value.toString('base64'),
			};
		},
		sandstormOffer(token, serializedDescriptor) {
			Sandstorm.offerUiView(token, serializedDescriptor,
				this.connection.sandstormSessionId());
		},
	});
}
