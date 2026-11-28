import { AppInterface as AppEvents } from '@rocket.chat/apps-engine/definition/metadata';
import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { SendMessageOptions } from './sendMessage';

describe('sendMessage save pipeline', () => {
	const user = { _id: 'user-id', username: 'sender', name: 'Sender' };
	const room = { _id: 'room-id' };
	const timestamp = new Date('2026-10-20T12:00:00.000Z');
	let message: Partial<IMessage>;
	let sendMessage: typeof import('./sendMessage').sendMessage;

	const isLoaded = sinon.stub();
	const triggerEvent = sinon.stub();
	const beforeSave = sinon.stub();
	const insertOne = sinon.stub();
	const updateOne = sinon.stub();
	const findOneById = sinon.stub();
	const afterSaveMessage = sinon.stub();
	const notifyOnRoomChangedById = sinon.stub();
	const settingsGet = sinon.stub();

	beforeEach(() => {
		message = { _id: 'message-id', msg: 'Original message', ts: timestamp, customFields: { priority: 'normal' } };
		isLoaded.reset();
		isLoaded.returns(true);
		triggerEvent.reset();
		triggerEvent.resolves();
		triggerEvent.withArgs(AppEvents.IPreMessageSentPrevent).resolves(false);
		triggerEvent.withArgs(AppEvents.IPreMessageSentExtend).callsFake(async (_event, value) => value);
		triggerEvent.withArgs(AppEvents.IPreMessageSentModify).callsFake(async (_event, value) => value);
		beforeSave.reset();
		beforeSave.callsFake(async ({ message: value }) => value);
		insertOne.reset();
		insertOne.resolves({ insertedId: 'message-id' });
		updateOne.reset();
		updateOne.resolves({ upsertedCount: 1 });
		findOneById.reset();
		findOneById.resolves(null);
		afterSaveMessage.reset();
		afterSaveMessage.resolves();
		notifyOnRoomChangedById.reset();
		notifyOnRoomChangedById.resolves();
		settingsGet.reset();
		settingsGet.withArgs('Message_CustomFields_Enabled').returns(true);
		settingsGet.withArgs('Message_CustomFields').returns(
			JSON.stringify({
				properties: { priority: { type: 'string' } },
			}),
		);

		({ sendMessage } = proxyquire.noCallThru().load('./sendMessage', {
			'@rocket.chat/apps': { AppEvents, Apps: { self: { isLoaded, triggerEvent } } },
			'@rocket.chat/core-services': { Message: { beforeSave } },
			'@rocket.chat/models': { Messages: { insertOne, updateOne, findOneById } },
			// Meteor's shape checks are outside this suite's scope. Keep validateMessage
			// and the custom-field validator real so app modifications are revalidated.
			'meteor/check': {
				check: sinon.stub(),
				Match: { Where: sinon.stub(), OneOf: sinon.stub(), test: sinon.stub().returns(true) },
			},
			'../../hooks/messages/afterSaveMessage': { afterSaveMessage },
			'../../settings': { settings: { get: settingsGet } },
			'../authorization/hasPermission': { hasPermissionAsync: sinon.stub().resolves(false) },
			'../media/file-upload': { FileUpload: { getPath: sinon.stub().returns('/file-upload') } },
			'../notifyListener': { notifyOnRoomChangedById },
		}));
	});

	function expectNoSaveEffects() {
		sinon.assert.notCalled(insertOne);
		sinon.assert.notCalled(updateOne);
		sinon.assert.neverCalledWith(triggerEvent, AppEvents.IPostMessageSent);
		sinon.assert.neverCalledWith(triggerEvent, AppEvents.IPostSystemMessageSent);
		sinon.assert.notCalled(afterSaveMessage);
		sinon.assert.notCalled(notifyOnRoomChangedById);
	}

	function expectNotifications(savedMessage: IMessage, options: SendMessageOptions) {
		sinon.assert.calledOnceWithExactly(triggerEvent.withArgs(AppEvents.IPostMessageSent), AppEvents.IPostMessageSent, savedMessage);
		sinon.assert.neverCalledWith(triggerEvent, AppEvents.IPostSystemMessageSent);
		sinon.assert.calledOnceWithExactly(afterSaveMessage, savedMessage, room, user, { options });
		sinon.assert.calledOnceWithExactly(notifyOnRoomChangedById, room._id);
	}

	[AppEvents.IPreMessageSentExtend, AppEvents.IPreMessageSentModify].forEach((hook) => {
		describe(hook, () => {
			[false, true].forEach((upsert) => {
				it(`persists valid app modifications and notifies after saving (upsert=${upsert})`, async () => {
					const modifications = { msg: 'App-modified message', customFields: { priority: 'high' } };
					triggerEvent.withArgs(hook).resolves(modifications);
					const options = { upsert, previewUrls: ['https://example.com'] };

					const result = await sendMessage(user, message, room, options);

					const expected = { ...message, ...modifications, _id: 'message-id', rid: room._id, u: user, ts: timestamp };
					expect(result).to.deep.equal(expected);
					sinon.assert.calledOnceWithExactly(beforeSave, {
						message: expected,
						room,
						user,
						previewUrls: options.previewUrls,
						parseUrls: undefined,
					});
					if (upsert) {
						sinon.assert.calledOnceWithMatch(
							updateOne,
							{ '_id': 'message-id', 'u._id': user._id },
							{ $set: modifications },
							{ upsert: true },
						);
						sinon.assert.notCalled(insertOne);
						sinon.assert.notCalled(findOneById);
						sinon.assert.callOrder(
							beforeSave,
							updateOne,
							triggerEvent.withArgs(AppEvents.IPostMessageSent),
							afterSaveMessage,
							notifyOnRoomChangedById,
						);
					} else {
						sinon.assert.calledOnceWithExactly(insertOne, expected);
						sinon.assert.notCalled(updateOne);
						sinon.assert.callOrder(
							beforeSave,
							insertOne,
							triggerEvent.withArgs(AppEvents.IPostMessageSent),
							afterSaveMessage,
							notifyOnRoomChangedById,
						);
					}
					expectNotifications(result as IMessage, options);
				});

				it(`rejects app-modified invalid custom fields before saving (upsert=${upsert})`, async () => {
					triggerEvent.withArgs(hook).resolves({ customFields: { priority: { invalid: true } } });

					await expect(sendMessage(user, message, room, { upsert })).to.be.rejectedWith('Invalid custom fields');

					sinon.assert.calledOnce(triggerEvent.withArgs(hook));
					sinon.assert.notCalled(beforeSave);
					sinon.assert.notCalled(findOneById);
					expectNoSaveEffects();
				});
			});
		});
	});

	[false, true].forEach((upsert) => {
		it(`stops when an app prevents the message (upsert=${upsert})`, async () => {
			triggerEvent.withArgs(AppEvents.IPreMessageSentPrevent).resolves(true);

			expect(await sendMessage(user, message, room, { upsert })).to.equal(undefined);

			sinon.assert.calledOnceWithExactly(triggerEvent, AppEvents.IPreMessageSentPrevent, message);
			sinon.assert.notCalled(beforeSave);
			sinon.assert.notCalled(findOneById);
			expectNoSaveEffects();
		});

		[undefined, null].forEach((cancelled) => {
			it(`stops when beforeSave returns ${cancelled} (upsert=${upsert})`, async () => {
				beforeSave.resolves(cancelled);

				expect(await sendMessage(user, message, room, { upsert })).to.equal(undefined);

				sinon.assert.calledOnce(beforeSave);
				sinon.assert.notCalled(findOneById);
				expectNoSaveEffects();
			});
		});
	});

	[{}, { upsert: false }].forEach((options) => {
		it(`does not repeat persistence or notifications for an existing ID (options=${JSON.stringify(options)})`, async () => {
			findOneById.resolves({ _id: message._id });

			expect(await sendMessage(user, message, room, options)).to.equal(undefined);

			sinon.assert.calledOnce(beforeSave);
			sinon.assert.calledOnceWithExactly(findOneById, 'message-id', { projection: { _id: 1 } });
			expectNoSaveEffects();
		});
	});

	it('uses the message returned by beforeSave for persistence and notifications', async () => {
		const savedMessage = { ...message, msg: 'Prepared by beforeSave', rid: room._id, u: user };
		beforeSave.resolves(savedMessage);

		const result = await sendMessage(user, message, room);

		expect(result).to.equal(savedMessage);
		sinon.assert.calledOnceWithExactly(insertOne, savedMessage);
		expectNotifications(result as IMessage, {});
	});

	it('continues saving when the app modify hook returns no modifications', async () => {
		triggerEvent.withArgs(AppEvents.IPreMessageSentModify).resolves(undefined);

		const result = await sendMessage(user, message, room);

		expect(result).to.deep.include({ msg: 'Original message', customFields: { priority: 'normal' } });
		sinon.assert.calledOnceWithExactly(insertOne, result);
		expectNotifications(result as IMessage, {});
	});
});
