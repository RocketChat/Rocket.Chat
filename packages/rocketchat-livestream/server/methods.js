import {Meteor} from 'meteor/meteor';
import google from 'googleapis';
const OAuth2 = google.auth.OAuth2;


const p = fn => new Promise(function(resolve, reject) {
	fn(function(err, value) {
		if (err) {
			return reject(err);
		}
		resolve(value.data);
	});
});

Meteor.methods({
	async livestreamGetChannel({rid}) {
		const user = Meteor.user();

		if (!(user.settings && user.settings.livestream)) {
			throw new Meteor.Error('error-action-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamGetChannel'
			});
		}

		const room = RocketChat.models.Rooms.findOne({_id: rid});

		if (!room) {
			// TODO: change error
			throw new Meteor.Error('error-action-not-allowed', 'You have no settings to livestream', {
				method: 'livestreamGetChannel'
			});
		}
		const auth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), 'http://localhost:3000/api/v1/livestream/oauth/callback');

		auth.setCredentials({
			access_token: user.settings.livestream.access_token,
  		refresh_token: user.settings.livestream.refresh_token
		});

		const youtube = google.youtube({version:'v3', auth});

		const [stream, broadcast] = await Promise.all([p((resolve) => youtube.liveStreams.insert({
			part: 'id,snippet,cdn,contentDetails,status',
			resource: {
				snippet: {
					'title': room.name || 'teste'
				},
				'cdn': {
					'format': '480p',
					'ingestionType': 'rtmp'
				}
			}
		}, resolve)), p((resolve)=> youtube.liveBroadcasts.insert({
			part: 'id,snippet,contentDetails,status',
			resource: {
				snippet: {
  				'title': room.name || 'teste',
					'scheduledStartTime' : new Date().toISOString()
				},
				'status': {
			    'privacyStatus': 'unlisted'
			  }
			}
		}, resolve))]);

		youtube.liveBroadcasts.transition({
			part:'id,status',
			id: broadcast.id,
			broadcastStatus: 'live'
		});

		const ret = await p(resolve => youtube.liveBroadcasts.bind({
			part: 'id,snippet,status',
			// resource: {
			id: broadcast.id,
			streamId: stream.id
		}, resolve));

		return {id: stream.cdn.ingestionInfo.streamName};


	}
});
