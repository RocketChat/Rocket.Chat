import type { BaseTest } from '../test';

export const createManager = async (api: BaseTest['api'], username: string) => {
	const response = await api.post('/livechat/users/manager', {
		username,
	});

	if (response.status() !== 200) {
		throw Error(`Unable to create manager [http status: ${response.status()}]`);
	}

	const { user: manager } = await response.json();

	return {
		response,
		data: manager,
		delete: async () => api.delete(`/livechat/users/manager/${manager._id}`),
	};
};
