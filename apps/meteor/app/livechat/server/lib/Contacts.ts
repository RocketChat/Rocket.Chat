import type {
	IOmnichannelSource,
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
	ILivechatCustomField,
	ILivechatVisitor,
	IOmnichannelRoom,
	IUser,
} from '@rocket.chat/core-typings';
import {
	LivechatVisitors,
	Users,
	LivechatRooms,
	LivechatCustomField,
	LivechatInquiry,
	Rooms,
	Subscriptions,
	LivechatContacts,
} from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';
import type { PaginatedResult, VisitorSearchChatsResult } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { MatchKeysAndValues, OnlyFieldsOfType, FindOptions, Sort } from 'mongodb';

import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import {
	notifyOnRoomChangedById,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnLivechatInquiryChangedByRoom,
} from '../../../lib/server/lib/notifyListener';
import { i18n } from '../../../utils/lib/i18n';
import { ContactMerger } from './ContactMerger';
import { Livechat } from './LivechatTyped';

type RegisterContactProps = {
	_id?: string;
	token: string;
	name: string;
	username?: string;
	email?: string;
	phone?: string;
	customFields?: Record<string, unknown | string>;
	contactManager?: {
		username: string;
	};
};

type CreateContactParams = {
	name: string;
	emails?: string[];
	phones?: string[];
	unknown: boolean;
	customFields?: Record<string, string | unknown>;
	contactManager?: string;
	channels?: ILivechatContactChannel[];
	importIds?: string[];
};

type VerifyContactChannelParams = {
	contactId: string;
	field: string;
	value: string;
	visitorId: string;
	roomId: string;
};

type UpdateContactParams = {
	contactId: string;
	name?: string;
	emails?: string[];
	phones?: string[];
	customFields?: Record<string, unknown>;
	contactManager?: string;
	channels?: ILivechatContactChannel[];
};

type GetContactsParams = {
	searchText?: string;
	count: number;
	offset: number;
	sort: Sort;
};

type GetContactHistoryParams = {
	contactId: string;
	source?: string;
	count: number;
	offset: number;
	sort: Sort;
};

export const Contacts = {
	async registerContact({
		token,
		name,
		email = '',
		phone,
		username,
		customFields = {},
		contactManager,
	}: RegisterContactProps): Promise<string> {
		check(token, String);

		const visitorEmail = email.trim().toLowerCase();

		if (contactManager?.username) {
			// verify if the user exists with this username and has a livechat-agent role
			const user = await Users.findOneByUsername(contactManager.username, { projection: { roles: 1 } });
			if (!user) {
				throw new Meteor.Error('error-contact-manager-not-found', `No user found with username ${contactManager.username}`);
			}
			if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('livechat-agent')) {
				throw new Meteor.Error('error-invalid-contact-manager', 'The contact manager must have the role "livechat-agent"');
			}
		}

		let contactId;

		const user = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (user) {
			contactId = user._id;
		} else {
			if (!username) {
				username = await LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (visitorEmail !== '' && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(visitorEmail))) {
				contactId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
					token,
				};

				contactId = (await LivechatVisitors.insertOne(userData)).insertedId;
			}
		}

		const allowedCF = await getAllowedCustomFields();
		const livechatData: Record<string, string> = validateCustomFields(allowedCF, customFields, { ignoreAdditionalFields: true });

		const fieldsToRemove = {
			// if field is explicitely set to empty string, remove
			...(phone === '' && { phone: 1 }),
			...(visitorEmail === '' && { visitorEmails: 1 }),
			...(!contactManager?.username && { contactManager: 1 }),
		};

		const updateUser: { $set: MatchKeysAndValues<ILivechatVisitor>; $unset?: OnlyFieldsOfType<ILivechatVisitor> } = {
			$set: {
				token,
				name,
				livechatData,
				// if phone has some value, set
				...(phone && { phone: [{ phoneNumber: phone }] }),
				...(visitorEmail && { visitorEmails: [{ address: visitorEmail }] }),
				...(contactManager?.username && { contactManager: { username: contactManager.username } }),
			},
			...(Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove }),
		};

		await LivechatVisitors.updateOne({ _id: contactId }, updateUser);

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const rooms: IOmnichannelRoom[] = await LivechatRooms.findByVisitorId(contactId, {}, extraQuery).toArray();

		if (rooms?.length) {
			for await (const room of rooms) {
				const { _id: rid } = room;

				const responses = await Promise.all([
					Rooms.setFnameById(rid, name),
					LivechatInquiry.setNameByRoomId(rid, name),
					Subscriptions.updateDisplayNameByRoomId(rid, name),
				]);

				if (responses[0]?.modifiedCount) {
					void notifyOnRoomChangedById(rid);
				}

				if (responses[1]?.modifiedCount) {
					void notifyOnLivechatInquiryChangedByRoom(rid, 'updated', { name });
				}

				if (responses[2]?.modifiedCount) {
					void notifyOnSubscriptionChangedByRoomId(rid);
				}
			}
		}

		return contactId;
	},
};

export async function getContactManagerIdByUsername(username?: IUser['username']): Promise<IUser['_id'] | undefined> {
	if (!username) {
		return;
	}

	const user = await Users.findOneByUsername(username, { projection: { _id: 1 } });

	return user?._id;
}

export async function getContactIdByVisitorId(visitorId: ILivechatVisitor['_id']): Promise<ILivechatContact['_id'] | null> {
	const contact = await LivechatContacts.findOneByVisitorId<Pick<ILivechatContact, '_id'>>(visitorId, { projection: { _id: 1 } });
	if (!contact) {
		return null;
	}
	return contact._id;
}

export async function migrateVisitorIfMissingContact(
	visitorId: ILivechatVisitor['_id'],
	source: IOmnichannelSource,
): Promise<ILivechatContact['_id'] | null> {
	Livechat.logger.debug(`Detecting visitor's contact ID`);
	// Check if there is any contact already linking to this visitorId
	const contactId = await getContactIdByVisitorId(visitorId);
	if (contactId) {
		return contactId;
	}

	const visitor = await LivechatVisitors.findOneById(visitorId);
	if (!visitor) {
		throw new Error('Failed to migrate visitor data into Contact information: visitor not found.');
	}

	return migrateVisitorToContactId(visitor, source);
}

export async function findContactMatchingVisitor(
	visitor: AtLeast<ILivechatVisitor, 'phone' | 'visitorEmails'>,
): Promise<ILivechatContact | null> {
	// Search for any contact that is not yet associated with any visitor and that have the same email or phone number as this visitor.
	return LivechatContacts.findContactMatchingVisitor(visitor);
}

async function getVisitorNewestSource(visitor: ILivechatVisitor): Promise<IOmnichannelSource | null> {
	const room = await LivechatRooms.findNewestByVisitorIdOrToken<Pick<IOmnichannelRoom, '_id' | 'source'>>(visitor._id, visitor.token, {
		projection: { source: 1 },
	});

	if (!room) {
		return null;
	}

	return room.source;
}

/**
	This function assumes you already ensured that the visitor is not yet linked to any contact
**/
export async function migrateVisitorToContactId(
	visitor: ILivechatVisitor,
	source?: IOmnichannelSource,
	useVisitorId = false,
): Promise<ILivechatContact['_id'] | null> {
	// If we haven't received any source and the visitor doesn't have any room yet, then there's no need to migrate it
	const visitorSource = source || (await getVisitorNewestSource(visitor));
	if (!visitorSource) {
		return null;
	}

	const existingContact = await findContactMatchingVisitor(visitor);
	if (!existingContact) {
		Livechat.logger.debug(`Creating a new contact for existing visitor ${visitor._id}`);
		return createContactFromVisitor(visitor, visitorSource, useVisitorId);
	}

	// There is already an existing contact with no linked visitors and matching this visitor's phone or email, so let's use it
	Livechat.logger.debug(`Adding channel to existing contact ${existingContact._id}`);
	await ContactMerger.mergeVisitorIntoContact(visitor, existingContact);

	// Update all existing rooms of that visitor to add the contactId to them
	await LivechatRooms.setContactIdByVisitorIdOrToken(existingContact._id, visitor._id, visitor.token);

	return existingContact._id;
}

export async function getContact(contactId: ILivechatContact['_id']): Promise<ILivechatContact | null> {
	const contact = await LivechatContacts.findOneById(contactId);
	if (contact) {
		return contact;
	}

	// If the contact was not found, search for a visitor with the same ID
	const visitor = await LivechatVisitors.findOneById(contactId);
	// If there's also no visitor with that ID, then there's nothing for us to get
	if (!visitor) {
		return null;
	}

	// ContactId is actually the ID of a visitor, so let's get the contact that is linked to this visitor
	const linkedContact = await LivechatContacts.findOneByVisitorId(contactId);
	if (linkedContact) {
		return linkedContact;
	}

	// If this is the ID of a visitor and there is no contact linking to it yet, then migrate it into a contact
	const newContactId = await migrateVisitorToContactId(visitor, undefined, true);
	// If no contact was created by the migration, this visitor doesn't need a contact yet, so let's return null
	if (!newContactId) {
		return null;
	}

	// Finally, let's return the data of the migrated contact
	return LivechatContacts.findOneById(newContactId);
}

export async function mapVisitorToContact(visitor: ILivechatVisitor, source: IOmnichannelSource): Promise<CreateContactParams> {
	return {
		name: visitor.name || visitor.username,
		emails: visitor.visitorEmails?.map(({ address }) => address),
		phones: visitor.phone?.map(({ phoneNumber }) => phoneNumber),
		unknown: true,
		channels: [
			{
				name: source.label || source.type.toString(),
				visitorId: visitor._id,
				blocked: false,
				verified: false,
				details: source,
			},
		],
		customFields: visitor.livechatData,
		contactManager: await getContactManagerIdByUsername(visitor.contactManager?.username),
	};
}

export async function createContactFromVisitor(
	visitor: ILivechatVisitor,
	source: IOmnichannelSource,
	useVisitorId = false,
): Promise<string> {
	const contactData = await mapVisitorToContact(visitor, source);

	const contactId = await createContact(contactData, useVisitorId ? visitor._id : undefined);

	await LivechatRooms.setContactIdByVisitorIdOrToken(contactId, visitor._id, visitor.token);

	return contactId;
}

export async function createContact(params: CreateContactParams, upsertId?: ILivechatContact['_id']): Promise<string> {
	const { name, emails, phones, customFields: receivedCustomFields = {}, contactManager, channels, unknown, importIds } = params;

	if (contactManager) {
		await validateContactManager(contactManager);
	}

	const allowedCustomFields = await getAllowedCustomFields();
	const customFields = validateCustomFields(allowedCustomFields, receivedCustomFields);

	const updateData = {
		name,
		emails: emails?.map((address) => ({ address })),
		phones: phones?.map((phoneNumber) => ({ phoneNumber })),
		contactManager,
		channels,
		customFields,
		unknown,
		...(importIds?.length ? { importIds } : {}),
	} as const;

	// Use upsert when doing auto-migration so that if there's multiple requests processing at the same time, they won't interfere with each other
	if (upsertId) {
		await LivechatContacts.upsertContact(upsertId, updateData);
		return upsertId;
	}

	return LivechatContacts.insertContact(updateData);
}

export async function updateContact(params: UpdateContactParams): Promise<ILivechatContact> {
	const { contactId, name, emails, phones, customFields: receivedCustomFields, contactManager, channels } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id'>>(contactId, { projection: { _id: 1 } });

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	if (contactManager) {
		await validateContactManager(contactManager);
	}

	const customFields = receivedCustomFields && validateCustomFields(await getAllowedCustomFields(), receivedCustomFields);

	const updatedContact = await LivechatContacts.updateContact(contactId, {
		name,
		emails: emails?.map((address) => ({ address })),
		phones: phones?.map((phoneNumber) => ({ phoneNumber })),
		contactManager,
		channels,
		customFields,
	});

	return updatedContact;
}

/**
 * Adds a new email into the contact's email list, if the email is already in the list it does not add anything
 * and simply return the data, since the email was aready registered :P
 *
 * @param contactId the id of the contact that will be updated
 * @param email the email that will be added to the contact
 * @returns the updated contact
 */
export async function addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact> {
	const contact = await LivechatContacts.findOneById(contactId);
	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const emails = contact.emails?.map(({ address }) => address) || [];
	if (!emails.includes(email)) {
		return LivechatContacts.updateContact(contactId, {
			emails: [...emails.map((e) => ({ address: e })), { address: email }],
		});
	}

	return contact;
}

export async function getContacts(params: GetContactsParams): Promise<PaginatedResult<{ contacts: ILivechatContact[] }>> {
	const { searchText, count, offset, sort } = params;

	const { cursor, totalCount } = LivechatContacts.findPaginatedContacts(searchText, {
		limit: count,
		skip: offset,
		sort: sort ?? { name: 1 },
	});

	const [contacts, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		contacts,
		count,
		offset,
		total,
	};
}

export async function getContactHistory(
	params: GetContactHistoryParams,
): Promise<PaginatedResult<{ history: VisitorSearchChatsResult[] }>> {
	const { contactId, source, count, offset, sort } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, 'channels'>>(contactId, { projection: { channels: 1 } });

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const visitorsIds = new Set(contact.channels?.map((channel: ILivechatContactChannel) => channel.visitorId));

	if (!visitorsIds?.size) {
		return { history: [], count: 0, offset, total: 0 };
	}

	const options: FindOptions<IOmnichannelRoom> = {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
		projection: {
			fname: 1,
			ts: 1,
			v: 1,
			msgs: 1,
			servedBy: 1,
			closedAt: 1,
			closedBy: 1,
			closer: 1,
			tags: 1,
			source: 1,
			lastMessage: 1,
			verified: 1,
		},
	};

	const { totalCount, cursor } = LivechatRooms.findPaginatedRoomsByVisitorsIdsAndSource({
		visitorsIds: Array.from(visitorsIds),
		source,
		options,
	});

	const [total, history] = await Promise.all([totalCount, cursor.toArray()]);

	return {
		history,
		count: history.length,
		offset,
		total,
	};
}

export async function getAllowedCustomFields(): Promise<Pick<ILivechatCustomField, '_id' | 'label' | 'regexp' | 'required'>[]> {
	return LivechatCustomField.findByScope(
		'visitor',
		{
			projection: { _id: 1, label: 1, regexp: 1, required: 1 },
		},
		false,
	).toArray();
}

export function validateCustomFields(
	allowedCustomFields: AtLeast<ILivechatCustomField, '_id' | 'label' | 'regexp' | 'required'>[],
	customFields: Record<string, string | unknown>,
	options?: { ignoreAdditionalFields?: boolean },
): Record<string, string> {
	const validValues: Record<string, string> = {};

	for (const cf of allowedCustomFields) {
		if (!customFields.hasOwnProperty(cf._id)) {
			if (cf.required) {
				throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label }));
			}
			continue;
		}
		const cfValue: string = trim(customFields[cf._id]);

		if (!cfValue || typeof cfValue !== 'string') {
			if (cf.required) {
				throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label }));
			}
			continue;
		}

		if (cf.regexp) {
			const regex = new RegExp(cf.regexp);
			if (!regex.test(cfValue)) {
				throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label }));
			}
		}

		validValues[cf._id] = cfValue;
	}

	if (!options?.ignoreAdditionalFields) {
		const allowedCustomFieldIds = new Set(allowedCustomFields.map((cf) => cf._id));
		for (const key in customFields) {
			if (!allowedCustomFieldIds.has(key)) {
				throw new Error(i18n.t('error-custom-field-not-allowed', { key }));
			}
		}
	}

	return validValues;
}

export async function validateContactManager(contactManagerUserId: string) {
	const contactManagerUser = await Users.findOneAgentById<Pick<IUser, '_id'>>(contactManagerUserId, { projection: { _id: 1 } });
	if (!contactManagerUser) {
		throw new Error('error-contact-manager-not-found');
	}
}

export const verifyContactChannel = makeFunction(async (_params: VerifyContactChannelParams): Promise<ILivechatContact | null> => null);

export const mergeContacts = makeFunction(async (_contactId: string, _visitorId: string): Promise<ILivechatContact | null> => null);
