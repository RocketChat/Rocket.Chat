import type { IAppsLivechatContact } from '@rocket.chat/apps';
import type { ILivechatContact } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { mappedDecodeAsync } from './mappedData';

/**
 * Rocket.Chat `ILivechatContact` <-> Apps-Engine `IAppsLivechatContact`.
 *
 * `decode` (Rocket.Chat -> Apps-Engine) is a straight clone, mirroring the legacy `convertContact`.
 * `encode` (Apps-Engine -> Rocket.Chat) maps every attribute individually via a nested field map so
 * no extra data coming from the app leaks through — mirroring the legacy `convertAppContact`.
 */
export const ContactCodec = z.codec(z.custom<ILivechatContact>(), z.custom<IAppsLivechatContact>(), {
	decode: (contact): IAppsLivechatContact => structuredClone(contact) as unknown as IAppsLivechatContact,
	encode: (contact): Promise<ILivechatContact> => {
		const map = {
			_id: '_id',
			_updatedAt: '_updatedAt',
			name: 'name',
			phones: {
				from: 'phones',
				list: true,
				map: {
					phoneNumber: 'phoneNumber',
				},
			},
			emails: {
				from: 'emails',
				list: true,
				map: {
					address: 'address',
				},
			},
			contactManager: 'contactManager',
			unknown: 'unknown',
			conflictingFields: {
				from: 'conflictingFields',
				list: true,
				map: {
					field: 'field',
					value: 'value',
				},
			},
			customFields: 'customFields',
			channels: {
				from: 'channels',
				list: true,
				map: {
					name: 'name',
					verified: 'verified',
					visitor: {
						from: 'visitor',
						map: {
							visitorId: 'visitorId',
							source: {
								from: 'source',
								map: {
									type: 'type',
									id: 'id',
								},
							},
						},
					},
					blocked: 'blocked',
					field: 'field',
					value: 'value',
					verifiedAt: 'verifiedAt',
					details: {
						from: 'details',
						map: {
							type: 'type',
							id: 'id',
							alias: 'alias',
							label: 'label',
							sidebarIcon: 'sidebarIcon',
							defaultIcon: 'defaultIcon',
							destination: 'destination',
						},
					},
					lastChat: {
						from: 'lastChat',
						map: {
							_id: '_id',
							ts: 'ts',
						},
					},
				},
			},
			createdAt: 'createdAt',
			lastChat: {
				from: 'lastChat',
				map: {
					_id: '_id',
					ts: 'ts',
				},
			},
			importIds: 'importIds',
		};

		return mappedDecodeAsync<ILivechatContact>(contact, map, { dropUnmapped: true });
	},
});
