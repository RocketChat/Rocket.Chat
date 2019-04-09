import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { jws } from 'jsrsasign';

Meteor.methods({
	'jitsi:generateAccessToken': () => {

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:generateToken' });
		}

		const jitsiDomain = RocketChat.settings.get('Jitsi_Domain');
		const jitsiApplicationId = RocketChat.settings.get('Jitsi_Application_ID');
		const jitsiApplicationSecret = RocketChat.settings.get('Jitsi_Application_Secret');

		function addUserContextToPayload(payload) {
			const user = Meteor.user();
			payload.context = {
				user: {
					name: user.name,
					email: user.emails[0].address,
					avatar: Meteor.absoluteUrl(`avatar/${ user.username }`),
					id: user._id,
				},
			};
			return payload;
		}

		const JITSI_OPTIONS = {
			jitsi_domain: jitsiDomain,
			jitsi_lifetime_token: '1hour', // only 1 hour (for security reasons)
			jitsi_application_id: jitsiApplicationId,
			jitsi_application_secret: jitsiApplicationSecret,
		};

		const HEADER = {
			typ: 'JWT',
			alg: 'HS256',
		};

		const commonPayload = {
			iss: JITSI_OPTIONS.jitsi_application_id,
			sub: JITSI_OPTIONS.jitsi_domain,
			iat: jws.IntDate.get('now'),
			nbf: jws.IntDate.get('now'),
			exp: jws.IntDate.get(`now + ${ JITSI_OPTIONS.jitsi_lifetime_token }`),
			aud: 'RocketChat',
			room: '*',
			context: '', // first empty
		};

		const header = JSON.stringify(HEADER);
		const payload = JSON.stringify(addUserContextToPayload(commonPayload));

		return jws.JWS.sign(HEADER.alg, header, payload, { rstr: JITSI_OPTIONS.jitsi_application_secret });
	},
});
