import { api, credentials, request } from '../api-data';

export const createChannel = () =>
	new Promise((resolver) => {
		const channelName = `channel.test.${Date.now()}`;

		request
			.post(api('channels.create'))
			.set(credentials)
			.send({
				name: channelName,
			})
			.end((err, res) => resolve(res.body.channel));
	});
