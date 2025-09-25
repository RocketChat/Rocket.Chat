import type { BaseTest } from '../test';

const removeMonitor = async (api: BaseTest['api'], id: string) =>
	api.post('/method.call/livechat:removeMonitor', {
		message: JSON.stringify({ msg: 'method', id: '33', method: 'livechat:removeMonitor', params: [id] }),
	});

export const createMonitor = async (api: BaseTest['api'], id: string) => {
	const response = await api.post('/v1/livechat/monitors.save', { username: id });

	if (response.status() !== 200) {
		throw new Error(`Failed to create monitor [http status: ${response.status()}]`);
	}

	const {
		_id,
		username,
		roles,
	} = await response.json();

	return {
		response,
		data: { _id, username, roles },
		delete: async () => removeMonitor(api, _id),
	};
};
