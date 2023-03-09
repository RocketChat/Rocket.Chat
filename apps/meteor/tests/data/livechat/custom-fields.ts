import type { Response } from 'supertest';
import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { credentials, request, methodCall, api } from './../api-data';

type ExtendedCustomField = Omit<ILivechatCustomField, '_id' | '_updatedAt'> & { field: string };

export const createCustomField = (customField: ExtendedCustomField): Promise<ExtendedCustomField> => new Promise((resolve, reject) => {
    request
        .get(api(`livechat/custom-fields/${customField.label}`))
        .set(credentials)
        .send()
        .end((err: Error, res: Response) => {
            if (err) {
                return reject(err);
            }
            if (res.body.customField != null && res.body.customField != undefined) {
                resolve(res.body.customField);
            } else {
                request
                .post(methodCall('livechat:saveCustomField'))
                .send({
                    message: JSON.stringify({
                        method: 'livechat:saveCustomField',
                        params: [null, customField],
                        id: 'id',
                        msg: 'method',
                    }),
                })
                .set(credentials)
                .end((err: Error, res: Response): void => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res.body);
                });
            }
    });

});

export const deleteCustomField = (customFieldID: string) => new Promise((resolve, reject) => {
    request
        .post(methodCall('livechat:removeCustomField'))
        .send({
            message: JSON.stringify({
                method: 'livechat:removeCustomField',
                params: [customFieldID],
                id: 'id',
                msg: 'method',
            }),
        })
        .set(credentials)
        .end((err: Error, res: Response): void => {
            if (err) {
                return reject(err);
            }
            resolve(res.body);
        });
});

