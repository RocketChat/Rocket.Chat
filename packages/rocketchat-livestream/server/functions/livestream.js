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

export const statusStreamLiveStream = async({
	id,
	access_token,
	refresh_token,
	clientId,
	clientSecret,
	status
}) => {
	const auth = new OAuth2(clientId, clientSecret);

	auth.setCredentials({
		access_token,
		refresh_token
	});

	const youtube = google.youtube({ version:'v3', auth });
	const result = await p(resolve => youtube.liveStreams.list({
		part:'id,status',
		id
	}, resolve));
	return result.items && result.items[0].status.streamStatus;
};

export const statusLiveStream = ({
	id,
	access_token,
	refresh_token,
	clientId,
	clientSecret,
	status
}) => {
	const auth = new OAuth2(clientId, clientSecret);

	auth.setCredentials({
		access_token,
		refresh_token
	});

	const youtube = google.youtube({ version:'v3', auth });

	return p(resolve => youtube.liveBroadcasts.transition({
		part:'id,status',
		id,
		broadcastStatus: status
	}, resolve));
};

export const createLiveStream = async({
	room,
	access_token,
	refresh_token,
	clientId,
	clientSecret
}) => {
	const auth = new OAuth2(clientId, clientSecret);

	auth.setCredentials({
		access_token,
		refresh_token
	});

	const youtube = google.youtube({ version:'v3', auth });

	const [stream, broadcast] = await Promise.all([p((resolve) => youtube.liveStreams.insert({
		part: 'id,snippet,cdn,contentDetails,status',
		resource: {
			snippet: {
				'title': room.name || 'RocketChat Broadcast'
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
				'title': room.name || 'RocketChat Broadcast',
				'scheduledStartTime' : new Date().toISOString()
			},
			'status': {
				'privacyStatus': 'unlisted'
			}
		}
	}, resolve))]);

	const ret = await p(resolve => youtube.liveBroadcasts.bind({
		part: 'id,snippet,status',
		// resource: {
		id: broadcast.id,
		streamId: stream.id
	}, resolve));

	return {id: stream.cdn.ingestionInfo.streamName, stream, broadcast};
};
