import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { Response } from 'supertest';

import { credentials, request, api } from '../api-data';

type ExtendedCustomField = Omit<ILivechatCustomField, '_id' | '_updatedAt'> & { field: string };

export const createCustomField = (customField: ExtendedCustomField): Promise<ExtendedCustomField> =>
	new Promise((resolve, reject) => {
		void request
			.get(api(`livechat/custom-fields/${customField.label}`))
			.set(credentials)
			.send()
			.end((err: Error, res: Response) => {
				if (err) {
					return reject(err);
				}
				if (res.body.customField !== null && res.body.customField !== undefined) {
					resolve(res.body.customField);
				} else {
					void request
						.post(api('livechat/custom-fields.save'))
						.set(credentials)
						.send({ customFieldId: null, customFieldData: customField })
						.end((err: Error, res: Response): void => {
							if (err) {
								return reject(err);
							}
							resolve(res.body.customField);
						});
				}
			});
	});

export const deleteCustomField = (customFieldID: string) =>
	new Promise((resolve, reject) => {
		void request
			.post(api('livechat/custom-fields.delete'))
			.set(credentials)
			.send({
				customFieldId: customFieldID,
			})
			.end((err: Error, res: Response): void => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
	});
