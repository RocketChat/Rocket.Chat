import { api, credentials, request } from '../api-data';

export const createChannel = (userCredentials) =>
	new Promise((resolve) => {
		const channelName = `channel.test.${ Date.now() }`;

		if (userCredentials) {
			request
				.post(api('channels.create'))
				.set(userCredentials)
				.send({
					name: channelName,
				})
				.end((err, res) => resolve(res.body.channel));
		} else {
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.end((err, res) => resolve(res.body.channel));
		}
	});
