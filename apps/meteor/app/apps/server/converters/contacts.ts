import type { IAppContactsConverter, IAppsLivechatContact } from '@rocket.chat/apps';
import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppContactsConverter implements IAppContactsConverter {
	async convertById(contactId: ILivechatContact['_id']): Promise<IAppsLivechatContact | undefined> {
		const contact = await LivechatContacts.findOneById(contactId);
		if (!contact) {
			return;
		}

		return this.convertContact(contact);
	}

	async convertContact(contact: undefined | null): Promise<undefined>;

	async convertContact(contact: ILivechatContact): Promise<IAppsLivechatContact>;

	async convertContact(contact: ILivechatContact | undefined | null): Promise<IAppsLivechatContact | undefined> {
		if (!contact) {
			return;
		}

		return structuredClone(contact);
	}

	convertAppContact(contact: undefined | null): Promise<undefined>;

	convertAppContact(contact: IAppsLivechatContact): Promise<ILivechatContact>;

	async convertAppContact(contact: IAppsLivechatContact | undefined | null): Promise<ILivechatContact | undefined> {
		if (!contact) {
			return;
		}

		// Map every attribute individually to ensure there are no extra data coming from the app and leaking into anything else.
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

		return transformMappedData(contact, map);
	}
}
