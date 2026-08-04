import { OmnichannelSourceType, type ILivechatVisitor, type IOmnichannelSource } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { CreateContactParams } from './createContact';

const getContactManagerIdByUsername = sinon.stub();
const getAllowedCustomFields = sinon.stub();

const { mapVisitorToContact } = proxyquire.noCallThru().load('./mapVisitorToContact', {
	'./getContactManagerIdByUsername': {
		getContactManagerIdByUsername,
	},
	'./getAllowedCustomFields': { getAllowedCustomFields },
});

const testDate = new Date();
const dataMap: [Partial<ILivechatVisitor>, IOmnichannelSource, CreateContactParams][] = [
	[
		{
			_id: 'visitor1',
			username: 'Username',
			name: 'Name',
			visitorEmails: [{ address: 'email1@domain.com' }, { address: 'email2@domain.com' }],
			phone: [{ phoneNumber: '10' }, { phoneNumber: '20' }],
			contactManager: {
				username: 'user1',
			},
			lastChat: { _id: 'afdsfdasf', ts: testDate },
		},
		{
			type: OmnichannelSourceType.WIDGET,
		},
		{
			name: 'Name',
			emails: ['email1@domain.com', 'email2@domain.com'],
			phones: ['10', '20'],
			unknown: true,
			channels: [
				{
					name: 'widget',
					visitor: {
						visitorId: 'visitor1',
						source: {
							type: OmnichannelSourceType.WIDGET,
						},
					},
					blocked: false,
					verified: false,
					details: {
						type: OmnichannelSourceType.WIDGET,
					},
					lastChat: { _id: 'afdsfdasf', ts: testDate },
				},
			],
			lastChat: { _id: 'afdsfdasf', ts: testDate },
			customFields: undefined,
			shouldValidateCustomFields: false,
			contactManager: 'manager1',
		},
	],

	[
		{
			_id: 'visitor1',
			username: 'Username',
			lastChat: { _id: 'afdsfdasf', ts: testDate },
		},
		{
			type: OmnichannelSourceType.SMS,
		},
		{
			name: 'Username',
			emails: undefined,
			phones: undefined,
			unknown: true,
			channels: [
				{
					name: 'sms',
					visitor: {
						visitorId: 'visitor1',
						source: {
							type: OmnichannelSourceType.SMS,
						},
					},
					blocked: false,
					verified: false,
					details: {
						type: OmnichannelSourceType.SMS,
					},
					lastChat: { _id: 'afdsfdasf', ts: testDate },
				},
			],
			customFields: undefined,
			shouldValidateCustomFields: false,
			contactManager: undefined,
			lastChat: { _id: 'afdsfdasf', ts: testDate },
		},
	],

	[
		{
			_id: 'visitor1',
			username: 'Username',
			activity: ['2024-11'],
			lastChat: {
				_id: 'last-chat-id',
				ts: testDate,
			},
		},
		{
			type: OmnichannelSourceType.WIDGET,
		},
		{
			name: 'Username',
			emails: undefined,
			phones: undefined,
			unknown: false,
			channels: [
				{
					name: 'widget',
					visitor: {
						visitorId: 'visitor1',
						source: {
							type: OmnichannelSourceType.WIDGET,
						},
					},
					blocked: false,
					verified: false,
					details: {
						type: OmnichannelSourceType.WIDGET,
					},
					lastChat: {
						_id: 'last-chat-id',
						ts: testDate,
					},
				},
			],
			customFields: undefined,
			shouldValidateCustomFields: false,
			lastChat: {
				_id: 'last-chat-id',
				ts: testDate,
			},
			contactManager: undefined,
		},
	],

	[
		{
			_id: 'visitor1',
			username: 'Username',
			livechatData: {
				customFieldId: 'customFieldValue',
				invalidCustomFieldId: 'invalidCustomFieldValue',
			},
			activity: [],
			lastChat: { _id: 'afdsfdasf', ts: testDate },
		},
		{
			type: OmnichannelSourceType.WIDGET,
		},
		{
			name: 'Username',
			emails: undefined,
			phones: undefined,
			unknown: true,
			channels: [
				{
					name: 'widget',
					visitor: {
						visitorId: 'visitor1',
						source: {
							type: OmnichannelSourceType.WIDGET,
						},
					},
					blocked: false,
					verified: false,
					details: {
						type: OmnichannelSourceType.WIDGET,
					},
					lastChat: { _id: 'afdsfdasf', ts: testDate },
				},
			],
			customFields: {
				customFieldId: 'customFieldValue',
			},
			shouldValidateCustomFields: false,
			contactManager: undefined,
			lastChat: { _id: 'afdsfdasf', ts: testDate },
		},
	],
];

describe('mapVisitorToContact', () => {
	beforeEach(() => {
		getContactManagerIdByUsername.reset();
		getContactManagerIdByUsername.callsFake((username) => {
			if (username === 'user1') {
				return 'manager1';
			}

			return undefined;
		});
		getAllowedCustomFields.resolves([{ _id: 'customFieldId', label: 'custom-field-label' }]);
	});

	dataMap.forEach(([visitor, source, contact], index) => {
		it(`should map an ILivechatVisitor + IOmnichannelSource to an ILivechatContact [${index}]`, async () => {
			expect(await mapVisitorToContact(visitor, source)).to.be.deep.equal(contact);
		});
	});
});
