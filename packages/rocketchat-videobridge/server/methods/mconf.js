import BigBlueButtonApi from 'meteor/rocketchat:bigbluebutton';
import { HTTP } from 'meteor/http';
import xml2js from 'xml2js';

const parser = new xml2js.Parser({
	explicitRoot: true
});

const parseString = Meteor.wrapAsync(parser.parseString);

const getMConfAPI = () => {
	const url = RocketChat.settings.get('bigbluebutton_server');
	const secret = RocketChat.settings.get('bigbluebutton_sharedSecret');
	const api = new BigBlueButtonApi(`${ url }/bigbluebutton/api`, secret);

	return { api, url };
};

Meteor.methods({
	mconfJoin({ rid }) {

		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'videobridge:join' });
		}

		if (!Meteor.call('canAccessRoom', rid, this.userId)) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'videobridge:join' });
		}

		if (!RocketChat.settings.get('bigbluebutton_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Not Allowed', { method: 'videobridge:join' });
		}

		const { api, url } = getMConfAPI();
		const meetingID = RocketChat.settings.get('uniqueID') + rid;
		const room = RocketChat.models.Rooms.findOneById(rid);
		const createUrl = api.urlFor('create', {
			name: room.t === 'd' ? 'Direct' : room.name,
			meetingID,
			attendeePW: 'ap',
			moderatorPW: 'mp',
			welcome: '<br>Welcome to <b>%%CONFNAME%%</b>!',
			meta_html5chat: false,
			meta_html5navbar: false,
			meta_html5autoswaplayout: true,
			meta_html5autosharewebcam: false,
			meta_html5hidepresentation: true
		});

		console.log(Meteor.absoluteUrl(`api/v1/videoconference.mconf.update/${ meetingID }`));

		const createResult = HTTP.get(createUrl);
		const doc = parseString(createResult.content);

		if (doc.response.returncode[0]) {
			const user = RocketChat.models.Users.findOneById(this.userId);

			const hookApi = api.urlFor('hooks/create', {
				meetingID,
				callbackURL: Meteor.absoluteUrl(`api/v1/videoconference.mconf.update/${ meetingID }`)
			});

			const hookResult = HTTP.get(hookApi);

			if (hookResult.statusCode !== 200) {
				// TODO improve error logging
				console.log({ hookResult });
			}

			RocketChat.saveStreamingOptions(rid, {
				type: 'call'
			});

			return {
				url: api.urlFor('join', {
					password: 'mp', //mp if moderator ap if attendee
					meetingID,
					fullName: user.username,
					userID: user._id,
					avatarURL: Meteor.absoluteUrl(`avatar/${ user.username }`),
					clientURL: `${ url }/html5client/join`
				})
			};
		}
	},

	mconfEnd({ rid }) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'videobridge:join' });
		}

		if (!Meteor.call('canAccessRoom', rid, this.userId)) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'videobridge:join' });
		}

		if (!RocketChat.settings.get('bigbluebutton_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Not Allowed', { method: 'videobridge:join' });
		}

		const { api } = getMConfAPI();
		const meetingID = RocketChat.settings.get('uniqueID') + rid;
		const endApi = api.urlFor('end', {
			meetingID,
			password: 'mp' //mp if moderator ap if attendee
		});

		const endApiResult = HTTP.get(endApi);

		if (endApiResult.statusCode !== 200) {
			// TODO improve error logging
			console.log({ endApiResult });
		}

	}
});

RocketChat.API.v1.addRoute('videoconference.mconf.update/:id', { authRequired: false }, {
	post() {
		// TODO check checksum
		const event = JSON.parse(this.bodyParams.event)[0];
		const eventType = event.data.id;
		const meetingID = event.data.attributes.meeting['external-meeting-id'];
		const rid = meetingID.replace(RocketChat.settings.get('uniqueID'), '');

		console.log(eventType, rid);

		if (eventType === 'meeting-ended') {
			RocketChat.saveStreamingOptions(rid, {});
		}

		// if (eventType === 'user-left') {
		// 	const { api } = getMConfAPI();

		// 	const getMeetingInfoApi = api.urlFor('getMeetingInfo', {
		// 		meetingID
		// 	});

		// 	const getMeetingInfoResult = HTTP.get(getMeetingInfoApi);

		// 	if (getMeetingInfoResult.statusCode !== 200) {
		// 		// TODO improve error logging
		// 		console.log({ getMeetingInfoResult });
		// 	}

		// 	const doc = parseString(getMeetingInfoResult.content);

		// 	if (doc.response.returncode[0]) {
		// 		const participantCount = parseInt(doc.response.participantCount[0]);
		// 		console.log(participantCount);
		// 	}
		// }
	}
});
