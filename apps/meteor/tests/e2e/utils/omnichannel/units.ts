import { faker } from '@faker-js/faker';
import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';

import { parseMeteorResponse } from '../parseMeteorResponse';
import type { BaseTest } from '../test';

type CreateUnitParams = {
	id?: string | null;
	name?: string;
	visibility?: 'public' | 'private';
	monitors?: { monitorId: string; username: string }[];
	departments?: { departmentId: string }[];
};

const removeUnit = async (api: BaseTest['api'], id: string) =>
	api.post('/method.call/omnichannel:removeUnit', {
		message: JSON.stringify({ msg: 'method', id: '35', method: 'livechat:removeUnit', params: [id] }),
	});

export const createOrUpdateUnit = async (
	api: BaseTest['api'],
	{ id = null, name, visibility, monitors, departments }: CreateUnitParams = {},
) => {
	const response = await api.post('/method.call/livechat:saveUnit', {
		message: JSON.stringify({
			msg: 'method',
			id: '34',
			method: 'livechat:saveUnit',
			params: [id, { name: name || faker.string.uuid(), visibility: visibility || 'public' }, monitors, departments],
		}),
	});

	const unit = await parseMeteorResponse<IOmnichannelBusinessUnit>(response);

	return {
		response,
		data: unit,
		delete: async () => removeUnit(api, unit?._id),
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
