import { faker } from '@faker-js/faker';
import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from '@rocket.chat/apps-engine/client/definition';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';
import { AppSubscriptionStatus, OmnichannelSourceType } from '@rocket.chat/core-typings';
import type {
	LicenseInfo,
	App,
	IMessage,
	IRoom,
	ISubscription,
	IUser,
	ILivechatContactChannel,
	Serialized,
} from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

import type { MessageWithMdEnforced } from '../../client/lib/parseMessageTextToAstMarkdown';

export function createFakeUser<TUser extends IUser>(overrides?: Partial<IUser> & Omit<TUser, keyof IUser>): TUser;
export function createFakeUser(overrides?: Partial<IUser>): IUser {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		createdAt: faker.date.recent(),
		roles: ['user'],
		active: faker.datatype.boolean(),
		type: 'user',
		...overrides,
	};
}

export const createFakeRoom = <T extends IRoom = IRoom>(overrides?: Partial<T & { retention?: { enabled: boolean } }>): T =>
	({
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		t: faker.helpers.arrayElement(['c', 'p', 'd']),
		msgs: faker.number.int({ min: 0 }),
		u: {
			_id: faker.database.mongodbObjectId(),
			username: faker.internet.userName(),
			name: faker.person.fullName(),
			...overrides?.u,
		},
		usersCount: faker.number.int({ min: 0 }),
		autoTranslateLanguage: faker.helpers.arrayElement(['en', 'es', 'pt', 'ar', 'it', 'ru', 'fr']),
		...overrides,
	}) as T;

export const createFakeSubscription = (overrides?: Partial<ISubscription>): ISubscription => ({
	_id: faker.database.mongodbObjectId(),
	_updatedAt: faker.date.recent(),
	u: {
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		...overrides?.u,
	},
	rid: faker.database.mongodbObjectId(),
	open: faker.datatype.boolean(),
	ts: faker.date.recent(),
	name: faker.person.fullName(),
	unread: faker.number.int({ min: 0 }),
	t: faker.helpers.arrayElement(['c', 'p', 'd']),
	ls: faker.date.recent(),
	lr: faker.date.recent(),
	userMentions: faker.number.int({ min: 0 }),
	groupMentions: faker.number.int({ min: 0 }),
	lowerCaseName: faker.person.fullName().toLowerCase(),
	lowerCaseFName: faker.person.fullName().toLowerCase(),
	...overrides,
});

export function createFakeMessage<TMessage extends IMessage>(overrides?: Partial<IMessage> & Omit<TMessage, keyof IMessage>): TMessage;
export function createFakeMessage(overrides?: Partial<IMessage>): IMessage {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		rid: faker.database.mongodbObjectId(),
		msg: faker.lorem.sentence(),
		ts: faker.date.recent(),
		u: {
			_id: faker.database.mongodbObjectId(),
			username: faker.internet.userName(),
			name: faker.person.fullName(),
			...overrides?.u,
		},
		...overrides,
	};
}

export function createFakeMessageWithMd<TMessage extends IMessage>(
	overrides?: Partial<MessageWithMdEnforced<TMessage>>,
): MessageWithMdEnforced<TMessage>;
export function createFakeMessageWithMd(overrides?: Partial<MessageWithMdEnforced<IMessage>>): MessageWithMdEnforced<IMessage> {
	const fakeMessage = createFakeMessage(overrides);

	return {
		...fakeMessage,
		md: parse(fakeMessage.msg),
		...overrides,
	};
}

export function createFakeApp(partialApp: Partial<App> = {}): App {
	const appId = faker.database.mongodbObjectId();

	const app: App = {
		id: appId,
		iconFileData: faker.image.dataUri(),
		name: faker.commerce.productName(),
		appRequestStats: {
			appId: partialApp.id ?? appId,
			totalSeen: faker.number.int({ min: 0, max: 100 }),
			totalUnseen: faker.number.int({ min: 0, max: 100 }),
		},
		author: {
			name: faker.company.name(),
			homepage: faker.internet.url(),
			support: faker.internet.email(),
		},
		description: faker.lorem.paragraph(),
		shortDescription: faker.lorem.sentence(),
		privacyPolicySummary: faker.lorem.sentence(),
		detailedDescription: {
			raw: faker.lorem.paragraph(),
			rendered: faker.lorem.paragraph(),
		},
		detailedChangelog: {
			raw: faker.lorem.paragraph(),
			rendered: faker.lorem.paragraph(),
		},
		categories: [],
		version: faker.system.semver(),
		versionIncompatible: faker.datatype.boolean(),
		price: faker.number.float({ min: 0, max: 1000 }),
		purchaseType: faker.helpers.arrayElement(['buy', 'subscription']),
		pricingPlans: [],
		iconFileContent: faker.image.dataUri(),
		isSubscribed: faker.datatype.boolean(),
		bundledIn: [],
		marketplaceVersion: faker.system.semver(),
		get latest() {
			return app;
		},
		subscriptionInfo: {
			typeOf: faker.lorem.word(),
			status: faker.helpers.enumValue(AppSubscriptionStatus),
			statusFromBilling: faker.datatype.boolean(),
			isSeatBased: faker.datatype.boolean(),
			seats: faker.number.int({ min: 0, max: 50 }),
			maxSeats: faker.number.int({ min: 50, max: 100 }),
			license: {
				license: faker.lorem.word(),
				version: faker.number.int({ min: 0, max: 3 }),
				expireDate: faker.date.future().toISOString(),
			},
			startDate: faker.date.past().toISOString(),
			periodEnd: faker.date.future().toISOString(),
			endDate: faker.date.future().toISOString(),
			isSubscribedViaBundle: faker.datatype.boolean(),
		},
		tosLink: faker.internet.url(),
		privacyLink: faker.internet.url(),
		modifiedAt: faker.date.recent().toISOString(),
		permissions: faker.helpers.multiple(() => ({
			name: faker.hacker.verb(),
			required: faker.datatype.boolean(),
		})),
		languages: faker.helpers.multiple(() => faker.location.countryCode()),
		createdDate: faker.date.past().toISOString(),
		private: faker.datatype.boolean(),
		documentationUrl: faker.internet.url(),
		migrated: faker.datatype.boolean(),
		...partialApp,
	};

	return app;
}

export const createFakeExternalComponentUserInfo = (partial: Partial<IExternalComponentUserInfo> = {}): IExternalComponentUserInfo => ({
	id: faker.database.mongodbObjectId(),
	username: faker.internet.userName(),
	avatarUrl: faker.image.avatar(),
	...partial,
});

export const createFakeExternalComponentRoomInfo = (partial: Partial<IExternalComponentRoomInfo> = {}): IExternalComponentRoomInfo => ({
	id: faker.database.mongodbObjectId(),
	members: faker.helpers.multiple(createFakeExternalComponentUserInfo),
	slugifiedName: faker.lorem.slug(),
	...partial,
});

export const createFakeLicenseInfo = (partial: Partial<Omit<LicenseInfo, 'license'>> = {}): Omit<LicenseInfo, 'license'> => ({
	activeModules: faker.helpers.arrayElements([
		'auditing',
		'canned-responses',
		'ldap-enterprise',
		'livechat-enterprise',
		'voip-enterprise',
		'omnichannel-mobile-enterprise',
		'engagement-dashboard',
		'push-privacy',
		'scalability',
		'teams-mention',
		'saml-enterprise',
		'oauth-enterprise',
		'device-management',
		'federation',
		'videoconference-enterprise',
		'message-read-receipt',
		'outlook-calendar',
		'hide-watermark',
		'custom-roles',
		'accessibility-certification',
	]),
	externalModules: [],
	preventedActions: {
		activeUsers: faker.datatype.boolean(),
		guestUsers: faker.datatype.boolean(),
		roomsPerGuest: faker.datatype.boolean(),
		privateApps: faker.datatype.boolean(),
		marketplaceApps: faker.datatype.boolean(),
		monthlyActiveContacts: faker.datatype.boolean(),
	},
	limits: {
		activeUsers: { value: faker.number.int({ min: 0 }), max: faker.number.int({ min: 0 }) },
		guestUsers: { value: faker.number.int({ min: 0 }), max: faker.number.int({ min: 0 }) },
		roomsPerGuest: { value: faker.number.int({ min: 0 }), max: faker.number.int({ min: 0 }) },
		privateApps: { value: faker.number.int({ min: 0 }), max: faker.number.int({ min: 0 }) },
		marketplaceApps: { value: faker.number.int({ min: 0 }), max: faker.number.int({ min: 0 }) },
		monthlyActiveContacts: { value: faker.number.int({ min: 0 }), max: faker.number.int({ min: 0 }) },
	},
	tags: faker.helpers.multiple(() => ({
		name: faker.commerce.productAdjective(),
		color: faker.internet.color(),
	})),
	trial: faker.datatype.boolean(),
	...partial,
});

export function createFakeMessageWithAttachment<TMessage extends IMessage>(overrides?: Partial<TMessage>): TMessage;
export function createFakeMessageWithAttachment(overrides?: Partial<IMessage>): IMessage {
	const fakeMessage = createFakeMessage(overrides);
	const fileId = faker.database.mongodbObjectId();
	const fileName = faker.system.commonFileName('txt');

	return {
		...fakeMessage,
		msg: '',
		file: {
			_id: fileId,
			name: fileName,
			type: 'text/plain',
			size: faker.number.int(),
			format: faker.string.alpha(),
		},
		attachments: [
			{
				type: 'file',
				title: fileName,
				title_link: `/file-upload/${fileId}/${fileName}`,
			},
		],
		files: [
			{
				_id: fileId,
				name: fileName,
				type: 'text/plain',
				size: faker.number.int(),
				format: faker.string.alpha(),
			},
		],
		...overrides,
	};
}

const guestNames = faker.helpers.uniqueArray(faker.person.firstName, 1000);

function pullNextVisitorName() {
	const guestName = guestNames.pop();

	if (!guestName) {
		throw new Error('exhausted guest names');
	}

	return guestName;
}

export function createFakeVisitor() {
	return {
		name: pullNextVisitorName(),
		email: faker.internet.email(),
	} as const;
}

export function createFakeContactChannel(overrides?: Partial<Serialized<ILivechatContactChannel>>): Serialized<ILivechatContactChannel> {
	return {
		name: 'widget',
		blocked: false,
		verified: false,
		...overrides,
		visitor: {
			visitorId: faker.string.uuid(),
			source: {
				type: OmnichannelSourceType.WIDGET,
			},
			...overrides?.visitor,
		},
		details: {
			type: OmnichannelSourceType.WIDGET,
			destination: '',
			...overrides?.details,
		},
	};
}

export function createFakeContact(overrides?: Partial<Serialized<ILivechatContact>>): Serialized<ILivechatContact> {
	return {
		_id: faker.string.uuid(),
		_updatedAt: new Date().toISOString(),
		name: pullNextVisitorName(),
		phones: [{ phoneNumber: faker.phone.number() }],
		emails: [{ address: faker.internet.email() }],
		unknown: true,
		channels: [createFakeContactChannel()],
		createdAt: new Date().toISOString(),
		...overrides,
	};
}
