import type { BaseTest } from '../test';

const removeMonitor = async (api: BaseTest['api'], id: string) =>
	api.post('/method.call/livechat:removeMonitor', {
		message: JSON.stringify({ msg: 'method', id: '33', method: 'livechat:removeMonitor', params: [id] }),
	});

export const createMonitor = async (api: BaseTest['api'], username: string) => {
	const response = await api.post('/livechat/monitors.create', { username });

	if (response.status() !== 200) {
		throw new Error(`Failed to create monitor [http status: ${response.status()}]`);
	}

	const data = await response.json();

	return {
		response,
		data,
		delete: async () => removeMonitor(api, data.username),
	};
};
