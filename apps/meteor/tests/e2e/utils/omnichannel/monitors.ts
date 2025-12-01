import type { BaseTest } from '../test';

const deleteMonitor = async (api: BaseTest['api'], username: string) => api.post('/livechat/monitors.delete', { username });

export const createMonitor = async (api: BaseTest['api'], username: string) => {
	const response = await api.post('/livechat/monitors.create', { username });

	if (response.status() !== 200) {
		throw new Error(`Failed to create monitor [http status: ${response.status()}]`);
	}

	const data = await response.json();

	return {
		response,
		data,
		delete: async () => deleteMonitor(api, data.username),
	};
};
