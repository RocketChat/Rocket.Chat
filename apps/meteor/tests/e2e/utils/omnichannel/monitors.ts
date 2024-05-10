import { BaseTest } from '../test';
import { parseMeteorResponse } from './utils';

const removeMonitor = async (api: BaseTest['api'], id: string) =>
	api.post('/method.call/livechat:removeMonitor', {
		message: JSON.stringify({ msg: 'method', id: '33', method: 'livechat:removeMonitor', params: [id] }),
	});

export const createMonitor = async (api: BaseTest['api'], id: string) => {
	const response = await api.post('/method.call/livechat:addMonitor', {
		message: JSON.stringify({
			msg: 'method',
			id: '17',
			method: 'livechat:addMonitor',
			params: [id],
		}),
	});

	if (response.status() !== 200) {
		throw new Error(`Failed to create monitor [http status: ${response.status()}]`);
	}

	const monitor = await parseMeteorResponse<{ _id: string; username: string }>(response);

	return {
		response,
		data: monitor,
		delete: async () => removeMonitor(api, monitor._id),
	};
};
