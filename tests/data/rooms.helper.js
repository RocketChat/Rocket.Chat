import { api, credentials, request } from './api-data';

export const createRoom = ({ name, type, username }) => {
	if (!type) {
		throw new Error('"type" is required in "createRoom" test helper');
	}
	if (type === 'd' && !username) {
		throw new Error('To be able to create DM Room, you must provide the username');
	}
	const endpoints = {
		c: 'channels.create',
		p: 'groups.create',
		d: 'im.create',
	};
	const params = type === 'd'
		? ({ username })
		: ({ name });

	return request.post(api(endpoints[type]))
		.set(credentials)
		.send(params);
};

export const closeRoom = ({ type, roomId }) => {
	if (!type) {
		throw new Error('"type" is required in "closeRoom" test helper');
	}
	if (!roomId) {
		throw new Error('"roomId" is required in "closeRoom" test helper');
	}
	const endpoints = {
		c: 'channels.close',
		p: 'groups.close',
		d: 'im.close',
	};
	return new Promise((resolve) => {
		request.post(api(endpoints[type]))
			.set(credentials)
			.send({
				roomId,
			})
			.end(resolve);
	});
};

export const archiveRoom = ({ type, roomId }) => request.post(api(`${ type }.archive`))
	.set(credentials)
	.send({
		roomId,
	});

export const unarchiveRoom = ({ type, roomId }) => request.post(api(`${ type }.unarchive`))
	.set(credentials)
	.send({
		roomId,
	});
