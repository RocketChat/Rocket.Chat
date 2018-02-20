import google from 'googleapis';

const getAccessToken = (cb) => {
	const OAuth2 = google.auth.OAuth2;
	const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), 'http://localhost:3000/_oauth/youtube');
	console.log(clientAuth);
	const url = clientAuth.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/youtube']
	});

	console.log(url);
	clientAuth.getToken('4/AABpItSMNRCHhufOL7fhH9j23b4f_mO9cRo62BSTtSHQGHLCPKJ5x3jG_2vWyItVNX3iXK8vIIWCkWUxOEEnn0Y#', (err, tokens) => {
		console.log('getting token', err, tokens);
		if (err) {
			return cb(err);
		}
		// set tokens to the client
		// TODO: tokens should be set by OAuth2 client.
		console.log(tokens);
		clientAuth.setCredentials(tokens);
		cb(clientAuth);
	});
};


Meteor.methods({
	'listYoutubeActivities'() {
		console.log('inside method');
		return getAccessToken((clientAuth) => {
			google.youtube('v3').activities.list({
				auth: clientAuth,
				part: 'snippet',
				mine: true,
				key: RocketChat.settings.get('Broadcasting_api_key')
			}, (err, result) => {
				console.log(err, result);
				return result;
			});
		});
		//


	}
});


// RocketChat.listYoutubeActivities = function() {
// 	const OAuth2 = google.auth.OAuth2;
// 	const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), 'http://localhost:3000/_oauth/youtube');
// 	console.log(clientAuth);
// 	const url = clientAuth.generateAuthUrl({
// 		access_type: 'offline',
// 		scope: ['https://www.googleapis.com/auth/youtube.readonly']
// 	});
//
// 	google.youtube.activities.list({
// 		auth: clientAuth,
// 		params: { part: 'snippet' }
// 	}, (err, result) => {
// 		console.log(err, result);
// 		return result;
// 	});
// };
