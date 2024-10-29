import type {
	ILivechatContact,
	ILivechatVisitor,
	ILivechatContactChannel,
	ILivechatContactConflictingField,
	IUser,
	DeepWritable,
	IOmnichannelSource,
} from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';
import type { UpdateFilter } from 'mongodb';

import { getContactManagerIdByUsername } from './getContactManagerIdByUsername';

type ManagerValue = { id: string } | { username: string };
type ContactFields = {
	email: string;
	phone: string;
	name: string;
	username: string;
	manager: ManagerValue;
	channel: ILivechatContactChannel;
};

type CustomFieldAndValue = { type: `customFields.${string}`; value: string };

export type FieldAndValue =
	| { type: keyof Omit<ContactFields, 'manager' | 'channel'>; value: string }
	| { type: 'manager'; value: ManagerValue }
	| { type: 'channel'; value: ILivechatContactChannel }
	| CustomFieldAndValue;

type ConflictHandlingMode = 'conflict' | 'overwrite' | 'ignore';

export class ContactMerger {
	private managerList = new Map<IUser['username'], IUser['_id'] | undefined>();

	private getManagerId(manager: ManagerValue): IUser['_id'] | undefined {
		if ('id' in manager) {
			return manager.id;
		}

		return this.managerList.get(manager.username);
	}

	private isSameManager(manager1: ManagerValue, manager2: ManagerValue): boolean {
		if ('id' in manager1 && 'id' in manager2) {
			return manager1.id === manager2.id;
		}
		if ('username' in manager1 && 'username' in manager2) {
			return manager1.username === manager2.username;
		}

		const id1 = this.getManagerId(manager1);
		const id2 = this.getManagerId(manager2);

		if (!id1 || !id2) {
			return false;
		}

		return id1 === id2;
	}

	private isSameChannel(channel1: ILivechatContactChannel, channel2: ILivechatContactChannel): boolean {
		return channel1.visitorId === channel2.visitorId;
	}

	private isSameField(field1: FieldAndValue, field2: FieldAndValue): boolean {
		if (field1.type === 'manager' && field2.type === 'manager') {
			return this.isSameManager(field1.value, field2.value);
		}

		if (field1.type === 'channel' && field2.type === 'channel') {
			return this.isSameChannel(field1.value, field2.value);
		}

		if (field1.type !== field2.type) {
			return false;
		}

		if (field1.value === field2.value) {
			return true;
		}

		return false;
	}

	private async loadDataForFields(...fieldLists: FieldAndValue[][]): Promise<void> {
		for await (const fieldList of fieldLists) {
			for await (const field of fieldList) {
				if (field.type !== 'manager' || 'id' in field.value) {
					continue;
				}

				if (this.managerList.has(field.value.username)) {
					continue;
				}

				const id = await getContactManagerIdByUsername(field.value.username);
				this.managerList.set(field.value.username, id);
			}
		}
	}

	static async getAllFieldsFromContact(contact: ILivechatContact): Promise<FieldAndValue[]> {
		const { customFields = {}, name, contactManager } = contact;

		const fields = new Set<FieldAndValue>();

		contact.emails?.forEach(({ address: value }) => fields.add({ type: 'email', value }));
		contact.phones?.forEach(({ phoneNumber: value }) => fields.add({ type: 'phone', value }));
		contact.channels?.forEach((value) => fields.add({ type: 'channel', value }));

		if (name) {
			fields.add({ type: 'name', value: name });
		}

		if (contactManager) {
			fields.add({ type: 'manager', value: { id: contactManager } });
		}

		Object.keys(customFields).forEach((key) => ({ type: `customFields.${key}`, value: customFields[key] }));

		// If the contact already has conflicts, load their values as well
		if (contact.conflictingFields) {
			for (const conflict of contact.conflictingFields) {
				fields.add({ type: conflict.field, value: conflict.value } as FieldAndValue);
			}
		}

		return [...fields];
	}

	static async getAllFieldsFromVisitor(visitor: ILivechatVisitor, source?: IOmnichannelSource): Promise<FieldAndValue[]> {
		const { livechatData: customFields = {}, contactManager, name, username } = visitor;

		const fields = new Set<FieldAndValue>();

		visitor.visitorEmails?.forEach(({ address: value }) => fields.add({ type: 'email', value }));
		visitor.phone?.forEach(({ phoneNumber: value }) => fields.add({ type: 'phone', value }));
		if (name) {
			fields.add({ type: 'name', value: name });
		}
		if (username) {
			fields.add({ type: 'username', value: username });
		}
		if (contactManager?.username) {
			fields.add({ type: 'manager', value: { username: contactManager?.username } });
		}
		Object.keys(customFields).forEach((key) => ({ type: `customFields.${key}`, value: customFields[key] }));

		if (source) {
			fields.add({
				type: 'channel',
				value: {
					name: source.label || source.type.toString(),
					visitorId: visitor._id,
					blocked: false,
					verified: false,
					details: source,
				},
			});
		}

		return [...fields];
	}

	static getFieldValuesByType<T extends keyof ContactFields>(fields: FieldAndValue[], type: T): ContactFields[T][] {
		return fields.filter((field) => field.type === type).map(({ value }) => value) as ContactFields[T][];
	}

	static async mergeFieldsIntoContact(
		fields: FieldAndValue[],
		contact: ILivechatContact,
		conflictHandlingMode: ConflictHandlingMode = 'conflict',
	): Promise<void> {
		const existingFields = await ContactMerger.getAllFieldsFromContact(contact);
		const overwriteData = conflictHandlingMode === 'overwrite';

		const merger = new ContactMerger();
		await merger.loadDataForFields(fields, existingFields);

		const newFields = fields.filter((field) => {
			// If the field already exists with the same value, ignore it
			if (existingFields.some((existingField) => merger.isSameField(existingField, field))) {
				return false;
			}

			// If the field is an username and the contact already has a name, ignore it as well
			if (field.type === 'username' && existingFields.some(({ type }) => type === 'name')) {
				return false;
			}

			return true;
		});

		const newPhones = ContactMerger.getFieldValuesByType(newFields, 'phone');
		const newEmails = ContactMerger.getFieldValuesByType(newFields, 'email');
		const newChannels = ContactMerger.getFieldValuesByType(newFields, 'channel');
		const newNamesOnly = ContactMerger.getFieldValuesByType(newFields, 'name');
		const newCustomFields = newFields.filter(({ type }) => type.startsWith('customFields.')) as CustomFieldAndValue[];
		// Usernames are ignored unless the contact has no other name
		const newUsernames = !contact.name && !newNamesOnly.length ? ContactMerger.getFieldValuesByType(newFields, 'username') : [];

		const dataToSet: DeepWritable<UpdateFilter<ILivechatContact>['$set']> = {};

		// Names, Managers and Custom Fields need are set as conflicting fields if the contact already has them
		const newNames = [...newNamesOnly, ...newUsernames];
		const newManagers = ContactMerger.getFieldValuesByType(newFields, 'manager')
			.map((manager) => {
				if ('id' in manager) {
					return manager.id;
				}
				return merger.getManagerId(manager);
			})
			.filter((id) => Boolean(id));

		if (newNames.length && (!contact.name || overwriteData)) {
			const firstName = newNames.shift();
			if (firstName) {
				dataToSet.name = firstName;
			}
		}

		if (newManagers.length && (!contact.contactManager || overwriteData)) {
			const firstManager = newManagers.shift();
			if (firstManager) {
				dataToSet.contactManager = firstManager;
			}
		}

		const customFieldsPerName = new Map<string, CustomFieldAndValue[]>();
		for (const customField of newCustomFields) {
			if (!customFieldsPerName.has(customField.type)) {
				customFieldsPerName.set(customField.type, []);
			}
			customFieldsPerName.get(customField.type)?.push(customField);
		}

		const customFieldConflicts: CustomFieldAndValue[] = [];

		for (const [key, customFields] of customFieldsPerName) {
			const fieldName = key.replace('customFields.', '');

			// If the contact does not have this custom field yet, save the first value directly to the contact instead of as a conflict
			if (!contact.customFields?.[fieldName] || overwriteData) {
				const first = customFields.shift();
				if (first) {
					dataToSet[key] = first.value;
				}
			}

			customFieldConflicts.push(...customFields);
		}

		const allConflicts: ILivechatContactConflictingField[] =
			conflictHandlingMode !== 'conflict'
				? []
				: [
						...newNames.map((name): ILivechatContactConflictingField => ({ field: 'name', value: name })),
						...newManagers.map((manager): ILivechatContactConflictingField => ({ field: 'manager', value: manager as string })),
						...customFieldConflicts.map(({ type, value }): ILivechatContactConflictingField => ({ field: type, value })),
					];

		// Phones, Emails and Channels are simply added to the contact's existing list
		const dataToAdd: UpdateFilter<ILivechatContact>['$addToSet'] = {
			...(newPhones.length ? { phones: { $each: newPhones.map((phoneNumber) => ({ phoneNumber })) } } : {}),
			...(newEmails.length ? { emails: { $each: newEmails.map((address) => ({ address })) } } : {}),
			...(newChannels.length ? { channels: { $each: newChannels } } : {}),
			...(allConflicts.length ? { conflictingFields: { $each: allConflicts } } : {}),
		};

		const updateData: UpdateFilter<ILivechatContact> = {
			...(Object.keys(dataToSet).length ? { $set: dataToSet } : {}),
			...(Object.keys(dataToAdd).length ? { $addToSet: dataToAdd } : {}),
		};

		if (Object.keys(updateData).length) {
			await LivechatContacts.updateOne({ _id: contact._id }, updateData);
		}
	}

	public static async mergeVisitorIntoContact(visitor: ILivechatVisitor, contact: ILivechatContact): Promise<void> {
		const fields = await ContactMerger.getAllFieldsFromVisitor(visitor);

		await ContactMerger.mergeFieldsIntoContact(fields, contact, contact.unknown ? 'overwrite' : 'conflict');
	}
}
