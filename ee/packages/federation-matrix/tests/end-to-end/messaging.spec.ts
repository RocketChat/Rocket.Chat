import * as path from 'path';

import type { IMessage } from '@rocket.chat/core-typings';

import {
	uploadFileToRC,
	getFilesList,
	downloadFileAndVerifyBinary as downloadFileAndCompareBinary,
} from '../../../../../apps/meteor/tests/data/file.helper';
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
			federationConfig.rc1.url,
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

		describe('Media', () => {
			// Test file resources
			const resourcesDir = path.join(__dirname, '../resources');
			const testFiles = {
				image: {
					path: path.join(resourcesDir, 'sample_image.webp'),
					fileName: 'sample_image.webp',
					description: 'Image upload test',
				},
				pdf: {
					path: path.join(resourcesDir, 'sample_pdf.pdf'),
					fileName: 'sample_pdf.pdf',
					description: 'PDF document test',
				},
				video: {
					path: path.join(resourcesDir, 'sample_video.webm'),
					fileName: 'sample_video.webm',
					description: 'Video upload test',
				},
				audio: {
					path: path.join(resourcesDir, 'sample_audio.mp3'),
					fileName: 'sample_audio.mp3',
					description: 'Audio upload test',
				},
				text: {
					path: path.join(resourcesDir, 'sample_text.txt'),
					fileName: 'sample_text.txt',
					description: 'Text file upload test',
				},
			};

			describe('On RC', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-room-media-rc-${Date.now()}`;

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
				}, 10000);

				describe('Upload one image, and add a description', () => {
					it('should appear correctly locally and on the remote Element as messages', async () => {
						const fileInfo = testFiles.image;
						const uploadResponse = await uploadFileToRC(federatedChannel._id, fileInfo.path, fileInfo.description, rc1AdminRequestConfig);

						expect(uploadResponse.message).toBeDefined();

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();

						// RC view: Verify files array
						expect(rcMessage?.files).toBeDefined();
						expect(rcMessage?.files?.[0]?.name).toBe(fileInfo.fileName);
						expect(rcMessage?.files?.[0]?.type).toBe('image/webp');
						expect(rcMessage?.files?.[0]?.size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify attachments array
						expect(rcMessage?.attachments).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title).toBe(fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect(rcMessage?.attachments?.[0]?.title_link_download).toBe(true);
						expect((rcMessage?.attachments?.[0] as any)?.type).toBe('file');
						expect(rcMessage?.attachments?.[0]?.description).toBe(fileInfo.description);
						expect((rcMessage?.attachments?.[0] as any)?.image_url).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect((rcMessage?.attachments?.[0] as any)?.image_type).toBe('image/webp');
						expect((rcMessage?.attachments?.[0] as any)?.image_size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify federation
						expect(rcMessage?.federation?.eventId).not.toBe('');

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.body).toBe(fileInfo.fileName);
						expect(synapseMessage?.content.msgtype).toBe('m.image');
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files locally', async () => {
						const fileInfo = testFiles.image;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						const rcFile = rcFilesList.files.find((file) => file.name === fileInfo.fileName);
						expect(rcFile).toBeDefined();
						expect(rcFile?.type).toBe('image/webp');
						expect(rcFile?.federation).toBeDefined();

						// RC view: The file should have federation metadata
						expect(rcFile?.federation?.mxcUri).toBeDefined();
					});

					it('should be able to download the files locally and on the remote Element', async () => {
						const fileInfo = testFiles.image;

						// RC view: Get the file from history to get download URL
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();

						// RC view: Download and verify binary match from RC
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);

						// Element view: Download and verify binary match from Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.url).toBeDefined();

						const synapseFilesMatch = await hs1AdminApp.downloadFileAndCompareBinary(synapseMessage?.content.url as string, fileInfo.path);
						expect(synapseFilesMatch).toBe(true);
					});
				});

				describe('Upload one PDF, and add a description', () => {
					it('should appear correctly locally and on the remote Element as messages', async () => {
						const fileInfo = testFiles.pdf;
						const uploadResponse = await uploadFileToRC(federatedChannel._id, fileInfo.path, fileInfo.description, rc1AdminRequestConfig);

						expect(uploadResponse.message).toBeDefined();

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();

						// RC view: Verify files array
						expect(rcMessage?.files).toBeDefined();
						expect(rcMessage?.files?.[0]?.name).toBe(fileInfo.fileName);
						expect(rcMessage?.files?.[0]?.type).toBe('application/pdf');
						expect(rcMessage?.files?.[0]?.size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify attachments array
						expect(rcMessage?.attachments).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title).toBe(fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect(rcMessage?.attachments?.[0]?.title_link_download).toBe(true);
						expect((rcMessage?.attachments?.[0] as any)?.type).toBe('file');
						expect(rcMessage?.attachments?.[0]?.description).toBe(fileInfo.description);
						expect(rcMessage?.attachments?.[0]?.size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify federation
						expect(rcMessage?.federation?.eventId).not.toBe('');

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.body).toBe(fileInfo.fileName);
						expect(synapseMessage?.content.msgtype).toBe('m.file');
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files locally', async () => {
						const fileInfo = testFiles.pdf;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						const rcFile = rcFilesList.files.find((file) => file.name === fileInfo.fileName);
						expect(rcFile).toBeDefined();
						expect(rcFile?.type).toBe('application/pdf');
						expect(rcFile?.federation).toBeDefined();

						// RC view: The file should have federation metadata
						expect(rcFile?.federation?.mxcUri).toBeDefined();
					});

					it('should be able to download the files locally and on the remote Element', async () => {
						const fileInfo = testFiles.pdf;

						// RC view: Get the file from history to get download URL
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();

						// RC view: Download and verify binary match from RC
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);

						// Element view: Download and verify binary match from Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.url).toBeDefined();

						const synapseFilesMatch = await hs1AdminApp.downloadFileAndCompareBinary(synapseMessage?.content.url as string, fileInfo.path);
						expect(synapseFilesMatch).toBe(true);
					});
				});

				describe('Upload one Video, and add a description', () => {
					it('should appear correctly locally and on the remote Element as messages', async () => {
						const fileInfo = testFiles.video;
						const uploadResponse = await uploadFileToRC(federatedChannel._id, fileInfo.path, fileInfo.description, rc1AdminRequestConfig);

						expect(uploadResponse.message).toBeDefined();

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();

						// RC view: Verify files array
						expect(rcMessage?.files).toBeDefined();
						expect(rcMessage?.files?.[0]?.name).toBe(fileInfo.fileName);
						expect(rcMessage?.files?.[0]?.type).toBe('video/webm');
						expect(rcMessage?.files?.[0]?.size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify attachments array
						expect(rcMessage?.attachments).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title).toBe(fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect(rcMessage?.attachments?.[0]?.title_link_download).toBe(true);
						expect((rcMessage?.attachments?.[0] as any)?.type).toBe('file');
						expect(rcMessage?.attachments?.[0]?.description).toBe(fileInfo.description);
						expect((rcMessage?.attachments?.[0] as any)?.video_url).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect((rcMessage?.attachments?.[0] as any)?.video_type).toBe('video/webm');
						expect((rcMessage?.attachments?.[0] as any)?.video_size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify federation
						expect(rcMessage?.federation?.eventId).not.toBe('');

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.body).toBe(fileInfo.fileName);
						expect(synapseMessage?.content.msgtype).toBe('m.video');
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files locally', async () => {
						const fileInfo = testFiles.video;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						const rcFile = rcFilesList.files.find((file) => file.name === fileInfo.fileName);
						expect(rcFile).toBeDefined();
						expect(rcFile?.type).toBe('video/webm');
						expect(rcFile?.federation).toBeDefined();

						// RC view: The file should have federation metadata
						expect(rcFile?.federation?.mxcUri).toBeDefined();
					});

					it('should be able to download the files locally and on the remote Element', async () => {
						const fileInfo = testFiles.video;

						// RC view: Get the file from history to get download URL
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();

						// RC view: Download and verify binary match from RC
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);

						// Element view: Download and verify binary match from Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.url).toBeDefined();

						const synapseFilesMatch = await hs1AdminApp.downloadFileAndCompareBinary(synapseMessage?.content.url as string, fileInfo.path);
						expect(synapseFilesMatch).toBe(true);
					});
				});

				describe('Upload one Audio, and add a description', () => {
					it('should appear correctly locally and on the remote Element as messages', async () => {
						const fileInfo = testFiles.audio;
						const uploadResponse = await uploadFileToRC(federatedChannel._id, fileInfo.path, fileInfo.description, rc1AdminRequestConfig);

						expect(uploadResponse.message).toBeDefined();

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();

						// RC view: Verify files array
						expect(rcMessage?.files).toBeDefined();
						expect(rcMessage?.files?.[0]?.name).toBe(fileInfo.fileName);
						expect(rcMessage?.files?.[0]?.type).toBe('audio/mpeg');
						expect(rcMessage?.files?.[0]?.size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify attachments array
						expect(rcMessage?.attachments).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title).toBe(fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect(rcMessage?.attachments?.[0]?.title_link_download).toBe(true);
						expect((rcMessage?.attachments?.[0] as any)?.type).toBe('file');
						expect(rcMessage?.attachments?.[0]?.description).toBe(fileInfo.description);
						expect((rcMessage?.attachments?.[0] as any)?.audio_url).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect((rcMessage?.attachments?.[0] as any)?.audio_type).toBe('audio/mpeg');
						expect((rcMessage?.attachments?.[0] as any)?.audio_size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify federation
						expect(rcMessage?.federation?.eventId).not.toBe('');

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.body).toBe(fileInfo.fileName);
						expect(synapseMessage?.content.msgtype).toBe('m.audio');
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files locally', async () => {
						const fileInfo = testFiles.audio;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						const rcFile = rcFilesList.files.find((file) => file.name === fileInfo.fileName);
						expect(rcFile).toBeDefined();
						expect(rcFile?.type).toBe('audio/mpeg');
						expect(rcFile?.federation).toBeDefined();

						// RC view: The file should have federation metadata
						expect(rcFile?.federation?.mxcUri).toBeDefined();
					});

					it('should be able to download the files locally and on the remote Element', async () => {
						const fileInfo = testFiles.audio;

						// RC view: Get the file from history to get download URL
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();

						// RC view: Download and verify binary match from RC
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);

						// Element view: Download and verify binary match from Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.url).toBeDefined();

						const synapseFilesMatch = await hs1AdminApp.downloadFileAndCompareBinary(synapseMessage?.content.url as string, fileInfo.path);
						expect(synapseFilesMatch).toBe(true);
					});
				});

				describe('Upload one Text File, and add a description', () => {
					it('should appear correctly locally and on the remote Element as messages', async () => {
						const fileInfo = testFiles.text;
						const uploadResponse = await uploadFileToRC(federatedChannel._id, fileInfo.path, fileInfo.description, rc1AdminRequestConfig);

						expect(uploadResponse.message).toBeDefined();

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();

						// RC view: Verify files array
						expect(rcMessage?.files).toBeDefined();
						expect(rcMessage?.files?.[0]?.name).toBe(fileInfo.fileName);
						expect(rcMessage?.files?.[0]?.type).toBe('text/plain');
						expect(rcMessage?.files?.[0]?.size).toBe(uploadResponse.message.files?.[0]?.size);

						// RC view: Verify attachments array
						expect(rcMessage?.attachments).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title).toBe(fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toMatch(/^\/file-upload\/[^/]+\/.+$/);
						expect(rcMessage?.attachments?.[0]?.title_link_download).toBe(true);
						expect((rcMessage?.attachments?.[0] as any)?.type).toBe('file');
						expect(rcMessage?.attachments?.[0]?.description).toBe(fileInfo.description);

						// RC view: Verify federation
						expect(rcMessage?.federation?.eventId).not.toBe('');

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.body).toBe(fileInfo.fileName);
						expect(synapseMessage?.content.msgtype).toBe('m.file');
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files locally', async () => {
						const fileInfo = testFiles.text;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						const rcFile = rcFilesList.files.find((file) => file.name === fileInfo.fileName);
						expect(rcFile).toBeDefined();
						expect(rcFile?.type).toBe('text/plain');
						expect(rcFile?.federation).toBeDefined();

						// RC view: The file should have federation metadata
						expect(rcFile?.federation?.mxcUri).toBeDefined();
					});

					it('should be able to download the files locally and on the remote Element', async () => {
						const fileInfo = testFiles.text;

						// RC view: Get the file from history to get download URL
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.files?.[0]?.name === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();

						// RC view: Download and verify binary match from RC
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);

						// Element view: Download and verify binary match from Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.url).toBeDefined();

						const synapseFilesMatch = await hs1AdminApp.downloadFileAndCompareBinary(synapseMessage?.content.url as string, fileInfo.path);
						expect(synapseFilesMatch).toBe(true);
					});
				});
			});

			describe('On Element', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-room-media-element-${Date.now()}`;

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
				}, 10000);

				describe('Upload one image', () => {
					it('should appear correctly on the remote RC as messages', async () => {
						const fileInfo = testFiles.image;
						await hs1AdminApp.uploadFile(channelName, fileInfo.path, fileInfo.fileName);

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.msgtype).toBe('m.image');

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect((rcMessage?.attachments?.[0] as any)?.type).toBe('file');
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files on the remote RC', async () => {
						const fileInfo = testFiles.image;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						const rcFile = rcFilesList.files.find((file) => file.name === fileInfo.fileName);
						expect(rcFile).toBeDefined();
					});

					it('should be able to download the files on the remote RC', async () => {
						const fileInfo = testFiles.image;

						// RC view: Download and verify binary match from RC
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);
					});

					it('should be possible to filter the list of files on the remote RC', async () => {
						const fileInfo = testFiles.image;
						const filteredFiles = await getFilesList(federatedChannel._id, rc1AdminRequestConfig, {
							name: fileInfo.fileName,
						});
						expect(filteredFiles.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});
				});

				describe('Upload one PDF', () => {
					it('should appear correctly on the remote RC as messages', async () => {
						const fileInfo = testFiles.pdf;
						await hs1AdminApp.uploadFile(channelName, fileInfo.path, fileInfo.fileName);

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.msgtype).toBe('m.file');

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files on the remote RC', async () => {
						const fileInfo = testFiles.pdf;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						expect(rcFilesList.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});

					it('should be able to download the files on the remote RC', async () => {
						const fileInfo = testFiles.pdf;

						// RC view: Download and verify binary match from RC
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);
					});

					it('should be possible to filter the list of files on the remote RC', async () => {
						const fileInfo = testFiles.pdf;
						const filteredFiles = await getFilesList(federatedChannel._id, rc1AdminRequestConfig, {
							name: fileInfo.fileName,
						});
						expect(filteredFiles.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});
				});

				describe('Upload one Video', () => {
					it('should appear correctly on the remote RC as messages', async () => {
						const fileInfo = testFiles.video;
						await hs1AdminApp.uploadFile(channelName, fileInfo.path, fileInfo.fileName);

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.msgtype).toBe('m.video');

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files on the remote RC', async () => {
						const fileInfo = testFiles.video;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						expect(rcFilesList.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});

					it('should be able to download the files on the remote RC', async () => {
						const fileInfo = testFiles.video;

						// RC view: Download and verify binary match from RC
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);
					});

					it('should be possible to filter the list of files on the remote RC', async () => {
						const fileInfo = testFiles.video;
						const filteredFiles = await getFilesList(federatedChannel._id, rc1AdminRequestConfig, {
							name: fileInfo.fileName,
						});
						expect(filteredFiles.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});
				});

				describe('Upload one Audio', () => {
					it('should appear correctly on the remote RC as messages', async () => {
						const fileInfo = testFiles.audio;
						await hs1AdminApp.uploadFile(channelName, fileInfo.path, fileInfo.fileName);

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.msgtype).toBe('m.audio');

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files on the remote RC', async () => {
						const fileInfo = testFiles.audio;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						expect(rcFilesList.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});

					it('should be able to download the files on the remote RC', async () => {
						const fileInfo = testFiles.audio;

						// RC view: Download and verify binary match from RC
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);
					});

					it('should be possible to filter the list of files on the remote RC', async () => {
						const fileInfo = testFiles.audio;
						const filteredFiles = await getFilesList(federatedChannel._id, rc1AdminRequestConfig, {
							name: fileInfo.fileName,
						});
						expect(filteredFiles.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});
				});

				describe('Upload one Text File', () => {
					it('should appear correctly on the remote RC as messages', async () => {
						const fileInfo = testFiles.text;
						await hs1AdminApp.uploadFile(channelName, fileInfo.path, fileInfo.fileName);

						// Element view: Verify in Element
						const synapseMessage = await hs1AdminApp.findFileMessageInRoom(channelName, fileInfo.fileName);
						expect(synapseMessage).not.toBeNull();
						expect(synapseMessage?.content.msgtype).toBe('m.file');

						// RC view: Verify in RC loadHistory
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage).toBeDefined();
						expect(rcMessage?.federation?.eventId).toBe(synapseMessage?.event_id);
					});

					it('should appear in the list of files on the remote RC', async () => {
						const fileInfo = testFiles.text;

						// RC view: Verify in RC file list
						const rcFilesList = await getFilesList(federatedChannel._id, rc1AdminRequestConfig);
						expect(rcFilesList.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});

					it('should be able to download the files on the remote RC', async () => {
						const fileInfo = testFiles.text;

						// RC view: Download and verify binary match from RC
						const historyResponse = await loadHistory(federatedChannel._id, rc1AdminRequestConfig);
						const rcMessage = historyResponse.messages.find((message: IMessage) => message.attachments?.[0]?.title === fileInfo.fileName);
						expect(rcMessage?.attachments?.[0]?.title_link).toBeDefined();
						const downloadUrl = rcMessage?.attachments?.[0]?.title_link as string;
						const rcFilesMatch = await downloadFileAndCompareBinary(downloadUrl, fileInfo.path, rc1AdminRequestConfig);
						expect(rcFilesMatch).toBe(true);
					});

					it('should be possible to filter the list of files on the remote RC', async () => {
						const fileInfo = testFiles.text;
						const filteredFiles = await getFilesList(federatedChannel._id, rc1AdminRequestConfig, {
							name: fileInfo.fileName,
						});
						expect(filteredFiles.files.find((file) => file.name === fileInfo.fileName)).toBeDefined();
					});
				});
			});
		});
	});
});
