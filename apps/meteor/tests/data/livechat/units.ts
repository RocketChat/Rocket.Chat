import { faker } from '@faker-js/faker';
import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';

import { methodCall, credentials, request, api } from '../api-data';
import type { DummyResponse } from './utils';

export const createMonitor = async (username: string): Promise<{ _id: string; username: string; role: string[] }> => {
	return new Promise((resolve, reject) => {
		void request
			.post(api('livechat/monitors.create'))
			.set(credentials)
			.send({ username })
			.end((err: Error, res: DummyResponse<{ _id: string; username: string; role: string[] }, 'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}

				resolve(res.body);
			});
	});
};

export const createUnit = async (
	monitorId: string,
	username: string,
	departmentIds: string[],
	name?: string,
	extraMonitor: { monitorId: string; username: string }[] = [],
): Promise<IOmnichannelBusinessUnit> => {
	return new Promise((resolve, reject) => {
		void request
			.post(api('livechat/units'))
			.set(credentials)
			.send({
				unitData: {
					name: name || `${faker.person.firstName()} ${faker.string.uuid()}`,
					visibility: faker.helpers.arrayElement(['public', 'private']),
				},
				unitMonitors: [{ monitorId, username }, ...extraMonitor],
				unitDepartments: departmentIds.map((departmentId) => ({ departmentId })),
			})
			.end((err: Error, res: DummyResponse<IOmnichannelBusinessUnit, 'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
	});
};

export const deleteUnit = async (unit: IOmnichannelBusinessUnit): Promise<IOmnichannelBusinessUnit> => {
	return new Promise((resolve, reject) => {
		void request
			.post(methodCall(`livechat:removeUnit`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:removeUnit',
					params: [unit._id],
					id: '101',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<string, 'wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.message).result);
			});
	});
};

export const getUnit = (unitId: string): Promise<IOmnichannelBusinessUnit> => {
	return new Promise((resolve, reject) => {
		void request
			.get(api(`livechat/units/${unitId}`))
			.set(credentials)
			.end((err: Error, res: DummyResponse<IOmnichannelBusinessUnit, 'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
	});
};
