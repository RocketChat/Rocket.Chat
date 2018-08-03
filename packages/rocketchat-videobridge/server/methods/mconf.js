import BigBlueButtonApi from 'meteor/rocketchat:bigbluebutton';
import { HTTP } from 'meteor/http';
import xml2js from 'xml2js';

const parser = new xml2js.Parser({
	explicitRoot: true
});

const parseString = Meteor.wrapAsync(parser.parseString);

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

		const url = RocketChat.settings.get('bigbluebutton_server');
		const secret = RocketChat.settings.get('bigbluebutton_sharedSecret');
		const api = new BigBlueButtonApi(`${ url }/bigbluebutton/api`, secret);

		const meetingID = RocketChat.settings.get('uniqueID') + rid;
		const room = RocketChat.models.Rooms.findOneById(rid);
		const createUrl = api.urlFor('create', {
			name: room.t === 'd' ? 'Direct' : room.name,
			meetingID,
			attendeePW: 'ap',
			moderatorPW: 'mp',
			welcome: '<br>Welcome to <b>%%CONFNAME%%</b>!',
			meta_html5chat: false,
			meta_html5navbar: false
		});

		const createResult = HTTP.get(createUrl);
		const doc = parseString(createResult.content);

		if (doc.response.returncode[0]) {
			const user = RocketChat.models.Users.findOneById(this.userId);
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
	}
});
