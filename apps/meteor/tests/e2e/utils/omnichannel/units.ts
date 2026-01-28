import { faker } from '@faker-js/faker';

import type { BaseTest } from '../test';

type CreateUnitParams = {
	id?: string | null;
	name?: string;
	visibility?: 'public' | 'private';
	monitors?: { monitorId: string; username: string }[];
	departments?: { departmentId: string }[];
};

const removeUnit = async (api: BaseTest['api'], id: string) => api.delete(`/livechat/units/${id}`);

export const createOrUpdateUnit = async (
	api: BaseTest['api'],
	{ id = null, name, visibility, monitors, departments }: CreateUnitParams = {},
) => {
	const unitPayload = {
		unitData: {
			name: name ?? faker.string.uuid(),
			visibility: visibility ?? 'public',
		},
		unitMonitors: monitors,
		unitDepartments: departments,
	};

	const response = id ? await api.post(`/livechat/units/${id}`, unitPayload) : await api.post('/livechat/units', unitPayload);

	if (response.status() !== 200) {
		throw new Error(`Failed to create or update unit [http status: ${response.status()}]`);
	}

	const data = await response.json();

	return {
		response,
		data,
		delete: async () => removeUnit(api, data?._id),
	};
};

export const fetchUnitMonitors = async (api: BaseTest['api'], unitId: string) => {
	const response = await api.get(`/livechat/units/${unitId}/monitors`);

	if (response.status() !== 200) {
		throw new Error(`Failed to fetch unit monitors [http status: ${response.status()}]`);
	}

	const { monitors } = await response.json();

	return {
		response,
		data: monitors,
	};
};
