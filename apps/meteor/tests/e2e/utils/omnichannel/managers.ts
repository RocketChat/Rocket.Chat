import type { BaseTest } from '../test';

export const deleteManager = async (api: BaseTest['api'], managerId: string) => {
	const response = await api.delete(`/livechat/users/manager/${managerId}`);

	if (response.status() !== 200) {
		throw Error(`Unable to create manager [http status: ${response.status()}]`);
	}

	return response;
};

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
		delete: () => deleteManager(api, manager._id),
	};
};
