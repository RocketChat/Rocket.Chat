import { faker } from '@faker-js/faker';
import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';

import { methodCall, credentials, request, api } from '../api-data';
import type { DummyResponse } from './utils';

export const createMonitor = async (username: string): Promise<{ _id: string; username: string }> => {
	return new Promise((resolve, reject) => {
		void request
			.post(methodCall(`livechat:addMonitor`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:addMonitor',
					params: [username],
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

export const createUnit = async (
	monitorId: string,
	username: string,
	departmentIds: string[],
	name?: string,
	extraMonitor: { monitorId: string; username: string }[] = [],
): Promise<IOmnichannelBusinessUnit> => {
	return new Promise((resolve, reject) => {
		void request
			.post(methodCall(`livechat:saveUnit`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveUnit',
					params: [
						null,
						{ name: name || faker.person.firstName(), visibility: faker.helpers.arrayElement(['public', 'private']) },
						[{ monitorId, username }, ...extraMonitor],
						departmentIds.map((departmentId) => ({ departmentId })),
					],
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
