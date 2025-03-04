import { faker } from '@faker-js/faker';

import { createFakeMessage, createFakeMessageWithAttachment } from '../../../../../../mocks/data';

export const appMessageMock = {
	id: 'appMessageMock',
	text: 'rocket.cat',
	createdAt: new Date('2019-03-30T01:22:08.389Z'),
	updatedAt: new Date('2019-03-30T01:22:08.412Z'),
	groupable: false,
	room: {
		id: 'GENERAL',
		displayName: 'general',
		slugifiedName: 'general',
		type: 'c',
		creator: {
			username: 'rocket.cat',
			emails: [
				{
					address: 'rocketcat@rocket.chat',
					verified: true,
				},
			],
			type: 'bot',
			isEnabled: true,
			name: 'Rocket.Cat',
			roles: ['bot'],
			status: 'online',
			statusConnection: 'online',
			utcOffset: 0,
			createdAt: new Date('2019-04-13T01:33:14.191Z'),
			updatedAt: new Date('2019-04-13T01:33:14.191Z'),
		},
	},
	sender: {
		id: 'rocket.cat',
		username: 'rocket.cat',
		emails: [
			{
				address: 'rocketcat@rocket.chat',
				verified: true,
			},
		],
		type: 'bot',
		isEnabled: true,
		name: 'Rocket.Cat',
		roles: ['bot'],
		status: 'online',
		statusConnection: 'online',
		utcOffset: 0,
		createdAt: new Date('2019-04-13T01:33:14.191Z'),
		updatedAt: new Date('2019-04-13T01:33:14.191Z'),
	},
	_unmappedProperties_: {
		t: 'uj',
	},
};

export const appPartialMessageMock = {
	id: 'appPartialMessageMock',
	text: 'rocket.cat',
	groupable: false,
	emoji: ':smirk:',
	alias: 'rocket.feline',
};

export const appMessageInvalidRoomMock = {
	id: 'appMessageInvalidRoomMock',
	text: 'rocket.cat',
	createdAt: new Date('2019-03-30T01:22:08.389Z'),
	updatedAt: new Date('2019-03-30T01:22:08.412Z'),
	groupable: false,
	room: {
		id: 'INVALID IDENTIFICATION',
		displayName: 'Mocked Room',
		slugifiedName: 'mocked-room',
		type: 'c',
		creator: {
			username: 'rocket.cat',
			emails: [
				{
					address: 'rocketcat@rocket.chat',
					verified: true,
				},
			],
			type: 'bot',
			isEnabled: true,
			name: 'Rocket.Cat',
			roles: ['bot'],
			status: 'online',
			statusConnection: 'online',
			utcOffset: 0,
			createdAt: new Date('2019-04-13T01:33:14.191Z'),
			updatedAt: new Date('2019-04-13T01:33:14.191Z'),
		},
	},
	sender: {
		id: 'rocket.cat',
		username: 'rocket.cat',
		emails: [
			{
				address: 'rocketcat@rocket.chat',
				verified: true,
			},
		],
		type: 'bot',
		isEnabled: true,
		name: 'Rocket.Cat',
		roles: ['bot'],
		status: 'online',
		statusConnection: 'online',
		utcOffset: 0,
		createdAt: new Date('2019-04-13T01:33:14.191Z'),
		updatedAt: new Date('2019-04-13T01:33:14.191Z'),
	},
	_unmappedProperties_: {
		t: 'uj',
	},
};

const testUsername = faker.internet.userName();
const testUserId = faker.database.mongodbObjectId();
export const exportMessagesMock = [
	createFakeMessage({ t: 'uj', u: { _id: testUserId, username: testUsername }, msg: testUsername }),
	createFakeMessageWithAttachment(),
	createFakeMessageWithAttachment({
		attachments: [
			{
				type: 'file',
				title_link: '/file-upload/txt-file-id/test.txt',
			},
		],
	}),
	createFakeMessage(),
	createFakeMessage({ t: 'ujt', u: { _id: testUserId, username: testUsername }, msg: testUsername }),
];
