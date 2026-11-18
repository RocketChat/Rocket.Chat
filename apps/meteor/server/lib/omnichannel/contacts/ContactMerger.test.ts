import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		updateById: sinon.stub(),
	},
};

const getContactManagerIdByUsername = sinon.stub();

const { ContactMerger } = proxyquire.noCallThru().load('./ContactMerger', {
	'./getContactManagerIdByUsername': { getContactManagerIdByUsername },
});

describe('ContactMerger.mergeFieldsIntoContact', () => {
	const channel = {
		name: 'widget',
		visitor: { visitorId: 'visitor-1', source: { type: 'widget' } },
		blocked: false,
		verified: false,
		details: { type: 'widget' },
	};

	before(() => {
		mockModel('LivechatContacts', modelsMock.LivechatContacts);
	});

	beforeEach(() => {
		modelsMock.LivechatContacts.updateById.reset();
		getContactManagerIdByUsername.reset();
	});

	it('should not update the contact when every field already exists', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'name', value: 'John' },
				{ type: 'email', value: 'john@example.com' },
				{ type: 'customFields.cf1', value: 'a' },
				{ type: 'channel', value: { ...channel, name: 'renamed' } },
			],
			contact: {
				_id: 'contact-id',
				name: 'John',
				emails: [{ address: 'john@example.com' }],
				customFields: { cf1: 'a' },
				channels: [channel],
			},
		});

		expect(modelsMock.LivechatContacts.updateById.notCalled).to.be.true;
	});

	it('should set the first value of each new custom field the contact does not have', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'customFields.cf1', value: 'a1' },
				{ type: 'customFields.cf2', value: 'b1' },
				{ type: 'customFields.cf1', value: 'a2' },
			],
			contact: { _id: 'contact-id', name: 'John', channels: [] },
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{ $set: { 'customFields.cf1': 'a1', 'customFields.cf2': 'b1' } },
				{ session: undefined },
			),
		).to.be.true;
	});

	it('should neither set nor record a conflict for a custom field the contact already has', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'customFields.cf1', value: 'new' },
				{ type: 'customFields.cf2', value: 'b1' },
			],
			contact: { _id: 'contact-id', name: 'John', customFields: { cf1: 'old' }, channels: [] },
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{ $set: { 'customFields.cf2': 'b1' } },
				{ session: undefined },
			),
		).to.be.true;
	});

	it('should overwrite an existing custom field with the first new value in overwrite mode', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'customFields.cf1', value: 'new1' },
				{ type: 'customFields.cf1', value: 'new2' },
			],
			contact: { _id: 'contact-id', name: 'John', customFields: { cf1: 'old' }, channels: [] },
			conflictHandlingMode: 'overwrite',
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{ $set: { 'customFields.cf1': 'new1' } },
				{ session: undefined },
			),
		).to.be.true;
	});

	it('should set the name of a contact without one and record the other names as conflicts', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'name', value: 'John' },
				{ type: 'name', value: 'Johnny' },
			],
			contact: { _id: 'contact-id', channels: [] },
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{ $set: { name: 'John' }, $addToSet: { conflictingFields: { $each: [{ field: 'name', value: 'Johnny' }] } } },
				{ session: undefined },
			),
		).to.be.true;
	});

	it('should record a new name as a conflict when the contact already has a name', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [{ type: 'name', value: 'Johnny' }],
			contact: { _id: 'contact-id', name: 'John', channels: [] },
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{ $addToSet: { conflictingFields: { $each: [{ field: 'name', value: 'Johnny' }] } } },
				{ session: undefined },
			),
		).to.be.true;
	});

	it('should replace the name without conflicts in overwrite mode', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'name', value: 'Johnny' },
				{ type: 'name', value: 'Jack' },
			],
			contact: { _id: 'contact-id', name: 'John', channels: [] },
			conflictHandlingMode: 'overwrite',
		});

		expect(modelsMock.LivechatContacts.updateById.calledOnceWithExactly('contact-id', { $set: { name: 'Johnny' } }, { session: undefined }))
			.to.be.true;
	});

	it('should drop new names in ignore mode', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [{ type: 'name', value: 'Johnny' }],
			contact: { _id: 'contact-id', name: 'John', channels: [] },
			conflictHandlingMode: 'ignore',
		});

		expect(modelsMock.LivechatContacts.updateById.notCalled).to.be.true;
	});

	it('should use the username as name only when there is no other name', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [{ type: 'username', value: 'john.doe' }],
			contact: { _id: 'contact-id', channels: [] },
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly('contact-id', { $set: { name: 'john.doe' } }, { session: undefined }),
		).to.be.true;
	});

	it('should ignore the username when a new name is given', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'username', value: 'john.doe' },
				{ type: 'name', value: 'John' },
			],
			contact: { _id: 'contact-id', channels: [] },
		});

		expect(modelsMock.LivechatContacts.updateById.calledOnceWithExactly('contact-id', { $set: { name: 'John' } }, { session: undefined }))
			.to.be.true;
	});

	it('should ignore the username when the contact already has a name', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [{ type: 'username', value: 'john.doe' }],
			contact: { _id: 'contact-id', name: 'John', channels: [] },
		});

		expect(modelsMock.LivechatContacts.updateById.notCalled).to.be.true;
	});

	it('should resolve manager usernames and set the first manager of a contact without one', async () => {
		const session = { id: 'session' };
		getContactManagerIdByUsername.withArgs('manager1').resolves('manager-1-id');
		getContactManagerIdByUsername.withArgs('unknown').resolves(undefined);

		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'manager', value: { username: 'unknown' } },
				{ type: 'manager', value: { username: 'manager1' } },
				{ type: 'manager', value: { id: 'manager-2-id' } },
			],
			contact: { _id: 'contact-id', name: 'John', channels: [] },
			session,
		});

		expect(getContactManagerIdByUsername.calledWithExactly('unknown', session)).to.be.true;
		expect(getContactManagerIdByUsername.calledWithExactly('manager1', session)).to.be.true;
		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{
					$set: { contactManager: 'manager-1-id' },
					$addToSet: { conflictingFields: { $each: [{ field: 'manager', value: 'manager-2-id' }] } },
				},
				{ session },
			),
		).to.be.true;
	});

	it('should treat a manager username matching the current manager id as the same manager', async () => {
		getContactManagerIdByUsername.withArgs('manager1').resolves('manager-1-id');

		await ContactMerger.mergeFieldsIntoContact({
			fields: [{ type: 'manager', value: { username: 'manager1' } }],
			contact: { _id: 'contact-id', name: 'John', contactManager: 'manager-1-id', channels: [] },
		});

		expect(modelsMock.LivechatContacts.updateById.notCalled).to.be.true;
	});

	it('should keep the 12 most recent distinct activities', async () => {
		await ContactMerger.mergeFieldsIntoContact({
			fields: [{ type: 'activity', value: ['2024-13', '2024-14', '2024-01'] }],
			contact: {
				_id: 'contact-id',
				name: 'John',
				channels: [],
				activity: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11'],
			},
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{
					$set: {
						activity: [
							'2024-02',
							'2024-03',
							'2024-04',
							'2024-05',
							'2024-06',
							'2024-07',
							'2024-08',
							'2024-09',
							'2024-10',
							'2024-11',
							'2024-13',
							'2024-14',
						],
					},
				},
				{ session: undefined },
			),
		).to.be.true;
	});

	it('should add new phones, emails and channels and clear the pre-registration flag', async () => {
		const newChannel = { ...channel, visitor: { visitorId: 'visitor-2', source: { type: 'widget' } } };

		await ContactMerger.mergeFieldsIntoContact({
			fields: [
				{ type: 'phone', value: '+1555' },
				{ type: 'email', value: 'new@example.com' },
				{ type: 'email', value: 'old@example.com' },
				{ type: 'channel', value: newChannel },
			],
			contact: { _id: 'contact-id', name: 'John', emails: [{ address: 'old@example.com' }], channels: [channel] },
		});

		expect(
			modelsMock.LivechatContacts.updateById.calledOnceWithExactly(
				'contact-id',
				{
					$set: { preRegistration: false },
					$addToSet: {
						phones: { $each: [{ phoneNumber: '+1555' }] },
						emails: { $each: [{ address: 'new@example.com' }] },
						channels: { $each: [newChannel] },
					},
				},
				{ session: undefined },
			),
		).to.be.true;
	});
});
