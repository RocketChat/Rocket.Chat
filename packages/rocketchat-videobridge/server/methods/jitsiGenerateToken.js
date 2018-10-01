// we need only jws functionality
import {jws} from 'jsrsasign';

Meteor.methods({
    'jitsi:generateAccessToken': () => {

        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'jitsi:generateToken'});
        }

        const jitsiDomain = RocketChat.settings.get('Jitsi_Domain');
        if (jitsiDomain !== "travelmeet.de") {
            return "";
        }

        function addUserContextToPayload(payload) {
            let user = Meteor.user();
            payload.context = {
                "user": {
                    "name": user.name,
                    "email": user.emails[0]["address"],
                    "avatar": Meteor.absoluteUrl(`avatar/${ user.username }`),
                    "id": user._id
                }
            };
            return payload;
        }

        const JITSI_OPTIONS = {
            "jitsi_domain": jitsiDomain,
            "jitsi_lifetime_token": "1hour",

            // these parameters are specific to the jitsiDomain - travelmeet.de ONLY
            "jitsi_application_id": "gs2SMqqF3dqVs7VFzsz7J7gDxKTmnbpR",
            "jitsi_application_secret": "267a93kqmbyusxa5r5n2wn2ugaen8sgx"
        };

        const HEADER = {
            "typ": "JWT",
            "alg": "HS256"
        };

        const commonPayload = {
            "iss": JITSI_OPTIONS.jitsi_application_id,
            "sub": JITSI_OPTIONS.jitsi_domain,
            "iat": jws.IntDate.get('now'),
            "nbf": jws.IntDate.get('now'),
            "exp": jws.IntDate.get('now + ' + JITSI_OPTIONS.jitsi_lifetime_token),
            "aud": "eip", // this is our service
            "room": "*",
            "context": ""
        };

        let header = JSON.stringify(HEADER),
            payload = JSON.stringify(addUserContextToPayload(commonPayload));

        return jws.JWS.sign(HEADER.alg, header, payload, {rstr: JITSI_OPTIONS.jitsi_application_secret});
    },
});
