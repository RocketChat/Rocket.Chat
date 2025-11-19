import type { IMessage } from '@rocket.chat/core-typings';

import { sendMessage } from '../../../../../apps/meteor/tests/data/messages.helper';
import { createRoom, loadHistory } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { getRequestConfig, createUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

(IS_EE ? describe : describe.skip)('Federation', () => {
	let rc1AdminRequestConfig: any;
	let hs1AdminApp: SynapseClient;
	let hs1User1App: SynapseClient;

	beforeAll(async () => {
		// Create admin request config for RC1
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.apiUrl,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword,
		);

		// Create user1 in RC1 using federation config values
		await createUser(
			{
				username: federationConfig.rc1.additionalUser1.username,
				password: federationConfig.rc1.additionalUser1.password,
				email: `${federationConfig.rc1.additionalUser1.username}@rocket.chat`,
				name: federationConfig.rc1.additionalUser1.username,
			},
			rc1AdminRequestConfig,
		);

		// Create admin Synapse client for HS1
		hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
		await hs1AdminApp.initialize();

		// Create user1 Synapse client for HS1
		hs1User1App = new SynapseClient(
			federationConfig.hs1.url,
			federationConfig.hs1.additionalUser1.matrixUserId,
			federationConfig.hs1.additionalUser1.password,
		);
		await hs1User1App.initialize();
	});

	afterAll(async () => {
		if (hs1AdminApp) {
			await hs1AdminApp.close();
		}
		if (hs1User1App) {
			await hs1User1App.close();
		}
	});

	describe('Messaging', () => {
		describe('Basic messaging', () => {
			describe('On RC1', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-room-messaging-rc1-${Date.now()}`;

					// Create a federated private room with federated user
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});

					federatedChannel = createResponse.body.group;

					expect(federatedChannel).toHaveProperty('_id');
					expect(federatedChannel).toHaveProperty('name', channelName);
					expect(federatedChannel).toHaveProperty('t', 'p');
					expect(federatedChannel).toHaveProperty('federated', true);

					// Accept invitation for the federated user
					const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId).not.toBe('');

					// Wait for federation synchronization
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}, 10000);

				it('Send a text message', async () => {
					const messageText = 'Hello from RC1';

					// RC view: Send a text message from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);

					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage?.content.body).toBe(messageText);
				});

				it('Send a text message containing an emoji via shortcut like :rocket: and another one entered via system', async () => {
					const messageText = 'Hello :rocket: from RC1 🚀';

					// RC view: Send a text message with emoji shortcut and system emoji from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Assert the md attribute matches the expected structure exactly
					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{ type: 'PLAIN_TEXT', value: 'Hello ' },
								{
									type: 'EMOJI',
									value: { type: 'PLAIN_TEXT', value: 'rocket' },
									shortCode: 'rocket',
								},
								{ type: 'PLAIN_TEXT', value: ' from RC1 ' },
								{ type: 'EMOJI', value: null, unicode: '🚀' },
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);

					// TODO: Verify emojis are correctly translated
					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);
				});

				it('Send just a single emoji using a shortcut', async () => {
					const messageText = ':smirk:';

					// RC view: Send a single emoji shortcut from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Assert the md attribute matches the expected structure exactly
					const expectedMd = [
						{
							type: 'BIG_EMOJI',
							value: [
								{
									type: 'EMOJI',
									value: { type: 'PLAIN_TEXT', value: 'smirk' },
									shortCode: 'smirk',
								},
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);

					// TODO: Verify emojis are correctly translated
					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage?.content.body).toBe(messageText);
				});

				it('Send just a single emoji via system emoji', async () => {
					const messageText = '😀';

					// RC view: Send a single system emoji from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Assert the md attribute matches the expected structure exactly
					const expectedMd = [
						{
							type: 'BIG_EMOJI',
							value: [{ type: 'EMOJI', value: null, unicode: '😀' }],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);

					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toContain(messageText);
				});

				it('Send a message containing plain text, bold, italic, and underlined text', async () => {
					const messageText = 'Plain text **bold** _italic_ __underline__';

					// RC view: Send a formatted text message from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// Wait for message to propagate
					// await new Promise((resolve) => setTimeout(resolve, 2000));

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage?.content.body).toBe(messageText);
				});

				it('Send a message containing a plain link address', async () => {
					const messageText = 'Check this link: https://www.wikipedia.org';

					// RC view: Send a message with plain link from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);

					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Check this link: ',
								},
								{
									type: 'LINK',
									value: {
										src: {
											type: 'PLAIN_TEXT',
											value: 'https://www.wikipedia.org',
										},
										label: [
											{
												type: 'PLAIN_TEXT',
												value: 'https://www.wikipedia.org',
											},
										],
									},
								},
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);

					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);
				});

				it('Send a message containing a markdown link address [google](google.com)', async () => {
					const messageText = 'Check this [google](google.com) link';

					// RC view: Send a message with markdown link from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);
					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{ type: 'PLAIN_TEXT', value: 'Check this ' },
								{
									type: 'LINK',
									value: { src: { type: 'PLAIN_TEXT', value: 'google.com' }, label: [{ type: 'PLAIN_TEXT', value: 'google' }] },
								},
								{ type: 'PLAIN_TEXT', value: ' link' },
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);

					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);
				});

				it('Send a message containing a code block', async () => {
					const messageText = 'Here is some code:\n```\nconst x = 1;\n```';

					// RC view: Send a message with code block from RC1
					const sendResponse = await sendMessage({
						rid: federatedChannel._id,
						msg: messageText,
						config: rc1AdminRequestConfig,
					});

					expect(sendResponse.body).toHaveProperty('success', true);

					// RC view: Verify message appears in RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);
					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Here is some code:',
								},
							],
						},
						{
							type: 'CODE',
							language: 'none',
							value: [
								{
									type: 'CODE_LINE',
									value: {
										type: 'PLAIN_TEXT',
										value: 'const x = 1;',
									},
								},
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);

					// Synapse view: Verify message appears correctly on remote Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);
				});
			});

			describe('On Element', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-room-messaging-element-${Date.now()}`;

					// Create a federated private room with federated user
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});

					federatedChannel = createResponse.body.group;

					expect(federatedChannel).toHaveProperty('_id');
					expect(federatedChannel).toHaveProperty('name', channelName);
					expect(federatedChannel).toHaveProperty('t', 'p');
					expect(federatedChannel).toHaveProperty('federated', true);

					// Accept invitation for the federated user
					const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId).not.toBe('');

					// Wait for federation synchronization
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}, 10000);

				it('Send a text message', async () => {
					const messageText = 'Hello from Element';

					// Synapse view: Send a text message from Element
					await hs1AdminApp.sendTextMessage(channelName, messageText);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);
				});

				it('Send a text message containing an emoji via shortcut like :rocket: and another one entered via system', async () => {
					const messageText = 'Hello :rocket: from Element 🚀';

					// Synapse view: Send a text message with emoji shortcut and system emoji from Element
					await hs1AdminApp.sendTextMessage(channelName, messageText);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Assert the md attribute matches the expected structure exactly
					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{ type: 'PLAIN_TEXT', value: 'Hello ' },
								{
									type: 'EMOJI',
									value: { type: 'PLAIN_TEXT', value: 'rocket' },
									shortCode: 'rocket',
								},
								{ type: 'PLAIN_TEXT', value: ' from Element ' },
								{ type: 'EMOJI', value: null, unicode: '🚀' },
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);
				});

				it('Send just a single emoji using a shortcut', async () => {
					const messageText = ':smirk:';

					// Synapse view: Send a single emoji shortcut from Element
					await hs1AdminApp.sendTextMessage(channelName, messageText);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Assert the md attribute matches the expected structure exactly
					const expectedMd = [
						{
							type: 'BIG_EMOJI',
							value: [
								{
									type: 'EMOJI',
									value: { type: 'PLAIN_TEXT', value: 'smirk' },
									shortCode: 'smirk',
								},
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);
				});

				it('Send just a single emoji via system emoji', async () => {
					const messageText = '😀';

					// Synapse view: Send a single system emoji from Element
					await hs1AdminApp.sendTextMessage(channelName, messageText);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toContain(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();

					// Assert the md attribute matches the expected structure exactly
					const expectedMd = [
						{
							type: 'BIG_EMOJI',
							value: [{ type: 'EMOJI', value: null, unicode: '😀' }],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);
				});

				it('Send a message containing plain text, bold, italic, and underlined text', async () => {
					const messageText = 'Plain text **bold** _italic_ __underline__';
					const htmlFormattedBody = 'Plain text <strong>bold</strong> <em>italic</em> <u>underline</u>';

					// Synapse view: Send a formatted text message from Element with HTML formatting
					await hs1AdminApp.sendHtmlMessage(channelName, messageText, htmlFormattedBody);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
				});

				it('Send a message containing a plain link address', async () => {
					const messageText = 'Check this link: https://www.wikipedia.org';

					// Synapse view: Send a message with plain link from Element
					await hs1AdminApp.sendTextMessage(channelName, messageText);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);

					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Check this link: ',
								},
								{
									type: 'LINK',
									value: {
										src: {
											type: 'PLAIN_TEXT',
											value: 'https://www.wikipedia.org',
										},
										label: [
											{
												type: 'PLAIN_TEXT',
												value: 'https://www.wikipedia.org',
											},
										],
									},
								},
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);
				});

				it('Send a message containing a markdown link address [google](google.com)', async () => {
					const messageText = 'Check this [google](google.com) link';
					const htmlFormattedBody = 'Check this <a href="google.com">google</a> link';

					// Synapse view: Send a message with markdown link from Element with HTML formatting
					await hs1AdminApp.sendHtmlMessage(channelName, messageText, htmlFormattedBody);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);
					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{ type: 'PLAIN_TEXT', value: 'Check this ' },
								{
									type: 'LINK',
									value: { src: { type: 'PLAIN_TEXT', value: 'google.com' }, label: [{ type: 'PLAIN_TEXT', value: 'google' }] },
								},
								{ type: 'PLAIN_TEXT', value: ' link' },
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);
				});

				it('Send a message containing a code block', async () => {
					const messageText = 'Here is some code:\n```\nconst x = 1;\n```';
					const htmlFormattedBody = 'Here is some code:<br><pre><code>const x = 1;</code></pre>';

					// Synapse view: Send a message with code block from Element with HTML formatting
					await hs1AdminApp.sendHtmlMessage(channelName, messageText, htmlFormattedBody);

					// Synapse view: Verify message appears in Element
					const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);
					expect(synapseMessage).not.toBeNull();
					expect(synapseMessage?.content.body).toBe(messageText);

					// RC view: Verify message appears correctly on remote RC1
					const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
					const rcMessage = historyResponse.messages.find((message: IMessage) => message.msg === messageText);
					expect(rcMessage).toBeDefined();
					expect(rcMessage?.msg).toBe(messageText);
					const expectedMd = [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Here is some code:',
								},
							],
						},
						{
							type: 'CODE',
							language: 'none',
							value: [
								{
									type: 'CODE_LINE',
									value: {
										type: 'PLAIN_TEXT',
										value: 'const x = 1;',
									},
								},
							],
						},
					];
					expect(rcMessage?.md).toEqual(expectedMd);
				});
			});
		});
	});
});
