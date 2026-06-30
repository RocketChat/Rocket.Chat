import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUploadDescriptor } from '@rocket.chat/apps-engine/definition/uploads/IUploadDescriptor';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { ModifyCreator } from '../modify/ModifyCreator';

describe('ModifyCreator', () => {
	const senderFn = (r: any) =>
		Promise.resolve({
			id: Math.random().toString(36).substring(2),
			jsonrpc: '2.0',
			result: r,
			serialize() {
				return JSON.stringify(this);
			},
		});

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'deno-test');
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('sends the correct payload in the request to create a message', async () => {
		const spying = mock.fn(senderFn);
		const modifyCreator = new ModifyCreator(spying);
		const messageBuilder = modifyCreator.startMessage();

		// Importing types from the Apps-Engine is problematic, so we'll go with `any` here
		messageBuilder
			.setRoom({ id: '123' } as IRoom)
			.setSender({ id: '456' } as IUser)
			.setText('Hello World')
			.setUsernameAlias('alias')
			.setAvatarUrl('https://avatars.com/123');

		// We can't get a legitimate return value here, so we ignore it
		// but we need to know that the request sent was well formed
		await modifyCreator.finish(messageBuilder);

		assert.deepStrictEqual(spying.mock.calls[0].arguments, [
			{
				method: 'bridges:getMessageBridge:doCreate',
				params: [
					{
						room: { id: '123' },
						sender: { id: '456' },
						text: 'Hello World',
						alias: 'alias',
						avatarUrl: 'https://avatars.com/123',
					},
					'deno-test',
				],
			},
		]);
	});

	it('sends the correct payload in the request to upload a buffer', async () => {
		const modifyCreator = new ModifyCreator(senderFn);

		const result = await modifyCreator
			.getUploadCreator()
			.uploadBuffer(Buffer.from([1, 2, 3, 4]), { filename: 'testfile' } as IUploadDescriptor);

		assert.deepStrictEqual(result, {
			method: 'accessor:getModifier:getCreator:getUploadCreator:uploadBuffer',
			params: [Buffer.from([1, 2, 3, 4]), { filename: 'testfile' }],
		});
	});

	it('sends the correct payload in the request to create a visitor', async () => {
		const modifyCreator = new ModifyCreator(senderFn);

		const result = (await modifyCreator.getLivechatCreator().createVisitor({
			token: 'random token',
			username: 'random username for visitor',
			name: 'Random Visitor',
		})) as any; // We modified the send function so it changed the original return type of the function

		assert.deepStrictEqual(result, {
			method: 'accessor:getModifier:getCreator:getLivechatCreator:createVisitor',
			params: [
				{
					token: 'random token',
					username: 'random username for visitor',
					name: 'Random Visitor',
				},
			],
		});
	});

	// This test is important because if we return a promise we break API compatibility
	it('does not return a promise for calls of the createToken() method of the LivechatCreator', () => {
		const modifyCreator = new ModifyCreator(senderFn);

		const result = modifyCreator.getLivechatCreator().createToken();

		assert.ok(!((result as any) instanceof Promise));
		assert.ok(typeof result === 'string', `Expected "${result}" to be of type "string", but got "${typeof result}"`);
	});

	it('throws an error when a proxy method of getLivechatCreator fails', async () => {
		const failingSenderFn = () => Promise.reject(new Error('Test error'));
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const livechatCreator = modifyCreator.getLivechatCreator();

		await assert.rejects(
			() =>
				livechatCreator.createAndReturnVisitor({
					token: 'visitor-token',
					username: 'visitor-username',
					name: 'Visitor Name',
				}),
			{ message: 'Test error' },
		);
	});

	it('throws an instance of Error when getLivechatCreator fails with a specific error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: { message: 'Livechat method error' } });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const livechatCreator = modifyCreator.getLivechatCreator();

		await assert.rejects(
			() =>
				livechatCreator.createVisitor({
					token: 'visitor-token',
					username: 'visitor-username',
					name: 'Visitor Name',
				}),
			{ message: 'Livechat method error' },
		);
	});

	it('throws a default Error when getLivechatCreator fails with an unknown error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: {} });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const livechatCreator = modifyCreator.getLivechatCreator();

		await assert.rejects(
			() =>
				livechatCreator.createVisitor({
					token: 'visitor-token',
					username: 'visitor-username',
					name: 'Visitor Name',
				}),
			{ message: 'An unknown error occurred' },
		);
	});

	it('throws an error when a proxy method of getUploadCreator fails', async () => {
		const failingSenderFn = () => Promise.reject(new Error('Upload error'));
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const uploadCreator = modifyCreator.getUploadCreator();

		await assert.rejects(
			() => uploadCreator.uploadBuffer(Buffer.from([1, 2, 3, 4]), { filename: 'testfile-reject' } as IUploadDescriptor),
			{
				message: 'Upload error',
			},
		);
	});

	it('throws an instance of Error when getUploadCreator fails with a specific error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: { message: 'Upload method error' } });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const uploadCreator = modifyCreator.getUploadCreator();

		await assert.rejects(
			() => uploadCreator.uploadBuffer(Buffer.from([1, 2, 3, 4]), { filename: 'testfile-reject' } as IUploadDescriptor),
			{
				message: 'Upload method error',
			},
		);
	});

	it('throws a default Error when getUploadCreator fails with an unknown error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: {} });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const uploadCreator = modifyCreator.getUploadCreator();

		await assert.rejects(
			() => uploadCreator.uploadBuffer(Buffer.from([1, 2, 3, 4]), { filename: 'testfile-reject' } as IUploadDescriptor),
			{
				message: 'An unknown error occurred',
			},
		);
	});

	it('throws an error when a proxy method of getEmailCreator fails', async () => {
		const failingSenderFn = () => Promise.reject(new Error('Email error'));
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const emailCreator = modifyCreator.getEmailCreator();

		await assert.rejects(
			() =>
				emailCreator.send({
					to: 'test@example.com',
					from: 'sender@example.com',
					subject: 'Test Email',
					text: 'This is a test email.',
				}),
			{ message: 'Email error' },
		);
	});

	it('throws an instance of Error when getEmailCreator fails with a specific error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: { message: 'Email method error' } });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const emailCreator = modifyCreator.getEmailCreator();

		await assert.rejects(
			() =>
				emailCreator.send({
					to: 'test@example.com',
					from: 'sender@example.com',
					subject: 'Test Email',
					text: 'This is a test email.',
				}),
			{ message: 'Email method error' },
		);
	});

	it('throws a default Error when getEmailCreator fails with an unknown error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: {} });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const emailCreator = modifyCreator.getEmailCreator();

		await assert.rejects(
			() =>
				emailCreator.send({
					to: 'test@example.com',
					from: 'sender@example.com',
					subject: 'Test Email',
					text: 'This is a test email.',
				}),
			{ message: 'An unknown error occurred' },
		);
	});

	it('throws an error when a proxy method of getContactCreator fails', async () => {
		const failingSenderFn = () => Promise.reject(new Error('Contact creation error'));
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const contactCreator = modifyCreator.getContactCreator();

		await assert.rejects(() => contactCreator.addContactEmail('test-contact-id', 'test@example.com'), {
			message: 'Contact creation error',
		});
	});

	it('throws an instance of Error when getContactCreator fails with a specific error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: { message: 'Contact creation error' } });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const contactCreator = modifyCreator.getContactCreator();

		await assert.rejects(() => contactCreator.addContactEmail('test-contact-id', 'test@example.com'), {
			message: 'Contact creation error',
		});
	});

	it('throws a default Error when getContactCreator fails with an unknown error object', async () => {
		const failingSenderFn = () => Promise.reject({ error: {} });
		const modifyCreator = new ModifyCreator(failingSenderFn);
		const contactCreator = modifyCreator.getContactCreator();

		await assert.rejects(() => contactCreator.addContactEmail('test-contact-id', 'test@example.com'), {
			message: 'An unknown error occurred',
		});
	});
});
