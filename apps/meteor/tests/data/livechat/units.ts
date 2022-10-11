import faker from "@faker-js/faker";
import { IOmnichannelBusinessUnit } from "@rocket.chat/core-typings";
import { methodCall, credentials, request } from "../api-data";
import { DummyResponse } from "./utils";

export const createMonitor = async (username: string): Promise<{ _id: string; username: string }> => {
    return new Promise((resolve, reject) => {
		request
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

export const createUnit = async (monitorId: string, username: string, departmentId: string): Promise<IOmnichannelBusinessUnit> => {
    return new Promise((resolve, reject) => {
        request
            .post(methodCall(`livechat:saveUnit`))
            .set(credentials)
            .send({
                message: JSON.stringify({
                    method: 'livechat:saveUnit',
                    params: [null, { name: faker.name.firstName(), visibility: faker.helpers.arrayElement(['public', 'private']) }, [{ monitorId, username }], [{ departmentId }]],
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