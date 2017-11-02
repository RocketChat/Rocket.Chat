import { ConferenceCallProvider, ConferenceCallTypes } from 'meteor/rocketchat:conferencecall';

class JitsiConferenceCallProvider extends ConferenceCallProvider {
	constructor() {
		super({
			id: 'Jitsi',
			name: 'Jitsi Meet',
			template: 'jitsiVideoTab',
			type: ConferenceCallTypes.VIDEO
		});
	}
}

RocketChat.conferenceCallProviders.add(new JitsiConferenceCallProvider());
