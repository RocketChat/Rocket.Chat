import fs from 'fs';
import path from 'path';

import type { Credentials } from '@rocket.chat/api-client';
import type {
	IMessage,
	IRole,
	IRoom,
	ITeam,
	IUpload,
	IUser,
	ImageAttachmentProps,
	MessageAttachment,
	SettingValue,
} from '@rocket.chat/core-typings';
import { isFileAttachment, isQuoteAttachment, TeamType } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { assert, expect } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { sleep } from '../../../lib/utils/sleep';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { sendSimpleMessage, sendMessage, deleteMessage } from '../../data/chat.helper';
import { imgURL } from '../../data/interactions';
import {
	getSettingValueById,
	restorePermissionToRoles,
	updateEEPermission,
	updatePermission,
	updateSetting,
} from '../../data/permissions.helper';
import { assignRoleToUser, createCustomRole, deleteCustomRole } from '../../data/roles.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const lstURL = './tests/e2e/fixtures/files/lst-test.lst';
const svgLogoURL = './public/images/logo/logo.svg';
const svgLogoFileName = 'logo.svg';

describe('[Rooms]', () => {
	before((done) => getCredentials(done));

	it('/rooms.get', async () => {
		const res = await request.get(api('rooms.get')).set(credentials).expect(200);

		expect(res.body).to.have.property('success', true);
		expect(res.body).to.have.property('update');
		expect(res.body).to.have.property('remove');
	});

	it('/rooms.get?updatedSince', async () => {
		const res = await request
			.get(api('rooms.get'))
			.set(credentials)
			.query({
				updatedSince: new Date(),
			})
			.expect(200);

		expect(res.body).to.have.property('success', true);
		expect(res.body).to.have.property('update').that.have.lengthOf(0);
		expect(res.body).to.have.property('remove').that.have.lengthOf(0);
	});

	describe('/rooms.saveNotification:', () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` })).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('/rooms.saveNotification:', async () => {
			const res = await request
				.post(api('rooms.saveNotification'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					notifications: {
						disableNotifications: '0',
						emailNotifications: 'nothing',
						audioNotificationValue: 'beep',
						desktopNotifications: 'nothing',
						mobilePushNotifications: 'mentions',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
	});

	describe('[/rooms.saveDraft]', () => {
		let testChannel: IRoom;
		let threadId: IMessage['_id'];
		let userWithoutSubscription: TestUser<IUser>;
		let userWithoutSubscriptionCredentials: Credentials;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `rooms.saveDraft.test.${Date.now()}-${Math.random()}` })).body.channel;
			userWithoutSubscription = await createUser({ joinDefaultChannels: false });
			userWithoutSubscriptionCredentials = await login(userWithoutSubscription.username, password);

			const rootMessage = (await sendSimpleMessage({ roomId: testChannel._id, text: 'thread root' })).body.message;
			threadId = rootMessage._id;
			await sendSimpleMessage({ roomId: testChannel._id, text: 'thread reply', tmid: threadId });
		});

		after(() => Promise.all([deleteRoom({ type: 'c', roomId: testChannel._id }), deleteUser(userWithoutSubscription)]));

		it('should save a draft on the user subscription', async () => {
			const draft = `draft-${Date.now()}`;

			await request
				.post(api('rooms.saveDraft'))
				.set(credentials)
				.send({ rid: testChannel._id, draft })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('draft', draft);
				});
		});

		it('should clear the draft from the user subscription', async () => {
			const draft = `draft-to-clear-${Date.now()}`;

			await request.post(api('rooms.saveDraft')).set(credentials).send({ rid: testChannel._id, draft }).expect(200);

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('draft', draft);
				});

			await request
				.post(api('rooms.saveDraft'))
				.set(credentials)
				.send({ rid: testChannel._id, draft: '' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.not.have.property('draft');
				});
		});

		it('should save a thread draft keyed by tmid without touching the main draft', async () => {
			const draft = `thread-draft-${Date.now()}`;

			await request
				.post(api('rooms.saveDraft'))
				.set(credentials)
				.send({ rid: testChannel._id, draft, tmid: threadId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.nested.property(`threadDrafts.${threadId}`, draft);
					expect(res.body.subscription).to.not.have.property('draft');
				});
		});

		it('should never write a nested key to the subscription when the tmid contains a mongo path separator', async () => {
			for (const tmid of ['threadDrafts.polluted', '__proto__.polluted', 'foo.bar.baz', '$set.x']) {
				await request
					.post(api('rooms.saveDraft'))
					.set(credentials)
					.send({ rid: testChannel._id, draft: 'polluted', tmid })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});

				await request.post(api('rooms.saveDraft')).set(credentials).send({ rid: testChannel._id, draft: '', tmid }).expect(400);
			}

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.subscription).to.not.have.nested.property('threadDrafts.polluted');
					expect(res.body.subscription).to.not.have.nested.property('threadDrafts.__proto__');
					expect(res.body.subscription).to.not.have.nested.property('threadDrafts.foo');
				});
		});

		it('should accept a thread draft for a message whose _id is non-alphanumeric (e.g. imported threads)', async () => {
			const importedRootId = `slack-C1-${Date.now()}-000001`;

			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { _id: importedRootId, rid: testChannel._id, msg: 'imported thread root' } })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.message).to.have.property('_id', importedRootId);
				});

			const draft = `imported-thread-draft-${Date.now()}`;

			await request
				.post(api('rooms.saveDraft'))
				.set(credentials)
				.send({ rid: testChannel._id, draft, tmid: importedRootId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.subscription.threadDrafts).to.have.property(importedRootId, draft);
				});
		});

		it('should allow clearing a thread draft even when the tmid is not a thread in the room', async () => {
			await request
				.post(api('rooms.saveDraft'))
				.set(credentials)
				.send({ rid: testChannel._id, draft: '', tmid: `nonExistentThread${Date.now()}` })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return the same error for a subscribed and an unsubscribed room regardless of tmid existence', async () => {
			for (const tmid of [threadId, `nonExistentThread${Date.now()}`]) {
				await request
					.post(api('rooms.saveDraft'))
					.set(userWithoutSubscriptionCredentials)
					.send({ rid: testChannel._id, draft: 'probe', tmid })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-invalid-subscription');
					});
			}
		});

		it('should clear a thread draft when saving an empty draft for the tmid', async () => {
			const draft = `thread-draft-${Date.now()}`;

			await request.post(api('rooms.saveDraft')).set(credentials).send({ rid: testChannel._id, draft, tmid: threadId }).expect(200);

			await request.post(api('rooms.saveDraft')).set(credentials).send({ rid: testChannel._id, draft: '', tmid: threadId }).expect(200);

			await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.not.have.nested.property(`threadDrafts.${threadId}`);
				});
		});

		it('should fail when the user does not have a subscription for the room', async () => {
			await request
				.post(api('rooms.saveDraft'))
				.set(userWithoutSubscriptionCredentials)
				.send({ rid: testChannel._id, draft: `draft-${Date.now()}` })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-subscription');
					expect(res.body).to.have.property('error', 'Invalid subscription [error-invalid-subscription]');
				});
		});

		describe('max allowed message size', () => {
			const maxAllowedSize = 10;
			let originalMaxAllowedSize: SettingValue;

			before(async () => {
				originalMaxAllowedSize = await getSettingValueById('Message_MaxAllowedSize');
				await updateSetting('Message_MaxAllowedSize', maxAllowedSize);
			});

			after(async () => {
				await updateSetting('Message_MaxAllowedSize', originalMaxAllowedSize);
			});

			it('should save a draft with the maximum allowed message size', async () => {
				const draft = 'a'.repeat(maxAllowedSize);

				await request
					.post(api('rooms.saveDraft'))
					.set(credentials)
					.send({ rid: testChannel._id, draft })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				await request
					.get(api('subscriptions.getOne'))
					.set(credentials)
					.query({ roomId: testChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.subscription).to.have.property('draft', draft);
					});
			});

			it('should fail when the draft exceeds the maximum allowed message size', async () => {
				await request.post(api('rooms.saveDraft')).set(credentials).send({ rid: testChannel._id, draft: '' }).expect(200);

				await request
					.post(api('rooms.saveDraft'))
					.set(credentials)
					.send({ rid: testChannel._id, draft: 'a'.repeat(maxAllowedSize + 1) })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'error-message-size-exceeded');
					});

				await request
					.get(api('subscriptions.getOne'))
					.set(credentials)
					.query({ roomId: testChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.subscription).to.not.have.property('draft');
					});
			});
		});
	});

	describe('/rooms.media', () => {
		let testChannel: IRoom;
		let user: TestUser<IUser>;
		let userCredentials: Credentials;
		const testChannelName = `channel.test.upload.${Date.now()}-${Math.random()}`;
		let blockedMediaTypes: SettingValue;

		before(async () => {
			user = await createUser({ joinDefaultChannels: false });
			userCredentials = await login(user.username, password);
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
			blockedMediaTypes = await getSettingValueById('FileUpload_MediaTypeBlackList');
			const newBlockedMediaTypes = (blockedMediaTypes as string)
				.split(',')
				.filter((type) => type !== 'image/svg+xml')
				.join(',');
			await updateSetting('FileUpload_MediaTypeBlackList', newBlockedMediaTypes);
			await updateSetting('E2E_Enable_Encrypt_Files', true);
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				deleteUser(user),
				updateSetting('FileUpload_Restrict_to_room_members', true),
				updateSetting('FileUpload_ProtectFiles', true),
				updateSetting('FileUpload_MediaTypeBlackList', blockedMediaTypes),
				updateSetting('E2E_Enable_Encrypt_Files', true),
			]),
		);

		it("don't upload a file to room with file field other than file", async () => {
			const res = await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('test', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error', '[invalid-field]');
			expect(res.body).to.have.property('errorType', 'invalid-field');
		});
		it("don't upload a file to room with empty file", async () => {
			const res = await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', '')
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
		});
		it("don't upload a file to room with more than 1 file", async () => {
			const res = await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-too-many-files');
		});

		let fileNewUrl: string;
		let fileOldUrl: string;
		let fileId: string;
		it('should upload a PNG file to room', async () => {
			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('file');
					expect(res.body.file).to.have.property('_id');
					expect(res.body.file).to.have.property('url');
					// expect(res.body.message.files[0]).to.have.property('type', 'image/png');
					// expect(res.body.message.files[0]).to.have.property('name', '1024x1024.png');

					fileNewUrl = res.body.file.url;
					fileOldUrl = res.body.file.url.replace('/file-upload/', '/ufs/GridFS:Uploads/');
					fileId = res.body.file._id;
				});

			await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
					expect(res.body.message).to.have.property('attachments');
					expect(res.body.message.attachments).to.be.an('array').of.length(1);
					expect(res.body.message.attachments[0]).to.have.property('image_type', 'image/png');
					expect(res.body.message.attachments[0]).to.have.property('title', '1024x1024.png');
					expect(res.body.message).to.have.property('files');
					expect(res.body.message.files).to.be.an('array').of.length(2);
					expect(res.body.message.files[0]).to.have.property('type', 'image/png');
					expect(res.body.message.files[0]).to.have.property('name', '1024x1024.png');
				});
		});

		it('should upload a LST file to room', async () => {
			let fileId;
			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', lstURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('file');
					expect(res.body.file).to.have.property('_id');
					expect(res.body.file).to.have.property('url');

					fileId = res.body.file._id;
				});

			await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
					expect(res.body.message).to.have.property('attachments');
					expect(res.body.message.attachments).to.be.an('array').of.length(1);
					expect(res.body.message.attachments[0]).to.have.property('format', 'LST');
					expect(res.body.message.attachments[0]).to.have.property('title', 'lst-test.lst');
					expect(res.body.message).to.have.property('files');
					expect(res.body.message.files).to.be.an('array').of.length(1);
					expect(res.body.message.files[0]).to.have.property('name', 'lst-test.lst');
				});
		});
		describe('/rooms.media - Max allowed size', () => {
			before(async () => updateSetting('Message_MaxAllowedSize', 10));
			after(async () => updateSetting('Message_MaxAllowedSize', 5000));
			it('should allow uploading a file with description under the max character limit', async () => {
				await request
					.post(api(`rooms.media/${testChannel._id}`))
					.set(credentials)
					.attach('file', imgURL)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('file');
						expect(res.body.file).to.have.property('_id');
						expect(res.body.file).to.have.property('url');

						fileNewUrl = res.body.file.url;
						fileOldUrl = res.body.file.url.replace('/file-upload/', '/ufs/GridFS:Uploads/');
						fileId = res.body.file._id;
					});

				await request
					.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
					.set(credentials)
					.send({
						description: '123456789',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message');
						expect(res.body.message).to.have.property('attachments');
						expect(res.body.message.attachments).to.be.an('array').of.length(1);
						expect(res.body.message.attachments[0]).to.have.property('image_type', 'image/png');
						expect(res.body.message.attachments[0]).to.have.property('title', '1024x1024.png');
						expect(res.body.message).to.have.property('files');
						expect(res.body.message.files).to.be.an('array').of.length(2);
						expect(res.body.message.files[0]).to.have.property('type', 'image/png');
						expect(res.body.message.files[0]).to.have.property('name', '1024x1024.png');
					});
			});

			it('should not allow uploading a file with description over the max character limit', async () => {
				await request
					.post(api(`rooms.media/${testChannel._id}`))
					.set(credentials)
					.attach('file', imgURL)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('file');
						expect(res.body.file).to.have.property('_id');
						expect(res.body.file).to.have.property('url');

						fileNewUrl = res.body.file.url;
						fileOldUrl = res.body.file.url.replace('/file-upload/', '/ufs/GridFS:Uploads/');
						fileId = res.body.file._id;
					});

				await request
					.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
					.set(credentials)
					.send({
						description: '12345678910',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-message-size-exceeded');
					});
			});
		});
		it('should not allow uploading a blocked media type to a room', async () => {
			await updateSetting('FileUpload_MediaTypeBlackList', 'text/plain');
			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', lstURL)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-file-type');
				});
		});

		it('should be able to get the file', async () => {
			await request.get(fileNewUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
		});

		it('should be able to get the file when no access to the room if setting allows it', async () => {
			await updateSetting('FileUpload_Restrict_to_room_members', false);
			await request.get(fileNewUrl).set(userCredentials).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).set(userCredentials).expect('Content-Type', 'image/png').expect(200);
		});

		it('should not be able to get the file when no access to the room if setting blocks', async () => {
			await updateSetting('FileUpload_Restrict_to_room_members', true);
			await request.get(fileNewUrl).set(userCredentials).expect(403);
			await request.get(fileOldUrl).set(userCredentials).expect(403);
		});

		it('should be able to get the file if member and setting blocks outside access', async () => {
			await updateSetting('FileUpload_Restrict_to_room_members', true);
			await request.get(fileNewUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
		});

		it('should not be able to get the file without credentials', async () => {
			await request.get(fileNewUrl).attach('file', imgURL).expect(403);
			await request.get(fileOldUrl).attach('file', imgURL).expect(403);
		});

		it('should be able to get the file without credentials if setting allows', async () => {
			await updateSetting('FileUpload_ProtectFiles', false);
			await request.get(fileNewUrl).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).expect('Content-Type', 'image/png').expect(200);
		});

		it('should generate thumbnail for SVG files correctly', async () => {
			const expectedFileName = `thumb-${svgLogoFileName}`;
			let res = await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', svgLogoURL)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('file');
			expect(res.body.file).to.have.property('_id');
			expect(res.body.file).to.have.property('url');

			const fileId = res.body.file._id;

			res = await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			const message = res.body.message as IMessage;
			const { files, attachments } = message;

			expect(files).to.be.an('array');
			const hasThumbFile = files?.some((file) => file.type === 'image/png' && file.name === expectedFileName);
			expect(hasThumbFile).to.be.true;

			expect(attachments).to.be.an('array');
			const thumbAttachment = attachments?.find((attachment) => attachment.title === svgLogoFileName);
			assert.isDefined(thumbAttachment);
			expect(thumbAttachment).to.be.an('object');
			const thumbUrl = (thumbAttachment as ImageAttachmentProps).image_url;

			await request.get(thumbUrl).set(credentials).expect('Content-Type', 'image/png');
		});

		it('should generate thumbnail for JPEG files correctly', async () => {
			const expectedFileName = `thumb-sample-jpeg.jpg`;
			let res = await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../mocks/files/sample-jpeg.jpg')))
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('file');
			expect(res.body.file).to.have.property('_id');
			expect(res.body.file).to.have.property('url');

			const fileId = res.body.file._id;

			res = await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			const message = res.body.message as IMessage;
			const { files, attachments } = message;

			expect(files).to.be.an('array');
			const hasThumbFile = files?.some((file) => file.type === 'image/jpeg' && file.name === expectedFileName);
			expect(hasThumbFile).to.be.true;

			expect(attachments).to.be.an('array');
			const thumbAttachment = attachments?.find((attachment) => attachment.title === `sample-jpeg.jpg`);
			expect(thumbAttachment).to.be.an('object');
			const thumbUrl = (thumbAttachment as ImageAttachmentProps).image_url;

			await request.get(thumbUrl).set(credentials).expect('Content-Type', 'image/jpeg');
		});

		// Support legacy behavior (not encrypting file)
		it('should correctly save file description and properties with type e2e', async () => {
			let fileId;
			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('file');
					expect(res.body.file).to.have.property('_id');
					expect(res.body.file).to.have.property('url');

					fileId = res.body.file._id;
				});

			await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.send({
					description: 'some_file_description',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
					expect(res.body.message).to.have.property('attachments');
					expect(res.body.message.attachments).to.be.an('array').of.length(1);
					expect(res.body.message.attachments[0]).to.have.property('image_type', 'image/png');
					expect(res.body.message.attachments[0]).to.have.property('title', '1024x1024.png');
					expect(res.body.message).to.have.property('files');
					expect(res.body.message.files).to.be.an('array').of.length(2);
					expect(res.body.message.files[0]).to.have.property('type', 'image/png');
					expect(res.body.message.files[0]).to.have.property('name', '1024x1024.png');
					expect(res.body.message.attachments[0]).to.have.property('image_alt', 'some_file_description');
				});
		});

		it('should correctly save encrypted file', async () => {
			let fileId;

			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../mocks/files/diagram.drawio')), {
					contentType: 'application/octet-stream',
				})
				.field({ content: JSON.stringify({ algorithm: 'rc.v1.aes-sha2', ciphertext: 'something' }) })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('file');
					expect(res.body.file).to.have.property('_id');
					expect(res.body.file).to.have.property('url');

					fileId = res.body.file._id;
				});

			await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
					expect(res.body.message).to.have.property('files');
					expect(res.body.message.files).to.be.an('array').of.length(1);
					expect(res.body.message.files[0]).to.have.property('type', 'application/octet-stream');
					expect(res.body.message.files[0]).to.have.property('name', 'diagram.drawio');
				});
		});

		it('should correctly save encrypted file with the default media type even if another type is provided', async () => {
			let fileId;

			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../mocks/files/sample-jpeg.jpg')), {
					contentType: 'image/jpeg',
				})
				.field({ content: JSON.stringify({ algorithm: 'rc.v1.aes-sha2', ciphertext: 'something' }) })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('file');
					expect(res.body.file).to.have.property('_id');
					expect(res.body.file).to.have.property('url');

					fileId = res.body.file._id;
				});

			await request
				.post(api(`rooms.mediaConfirm/${testChannel._id}/${fileId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
					expect(res.body.message).to.have.property('files');
					expect(res.body.message.files).to.be.an('array').of.length(1);
					expect(res.body.message.files[0]).to.have.property('type', 'application/octet-stream');
					expect(res.body.message.files[0]).to.have.property('name', 'sample-jpeg.jpg');
				});
		});

		it('should fail encrypted file upload when files encryption is disabled', async () => {
			await updateSetting('E2E_Enable_Encrypt_Files', false);

			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../mocks/files/diagram.drawio')), {
					contentType: 'application/octet-stream',
				})
				.field({ content: JSON.stringify({ algorithm: 'rc.v1.aes-sha2', ciphertext: 'something' }) })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-file-type');
				});
		});

		it('should fail encrypted file upload on blacklisted application/octet-stream media type', async () => {
			await updateSetting('FileUpload_MediaTypeBlackList', 'application/octet-stream');

			await request
				.post(api(`rooms.media/${testChannel._id}`))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../mocks/files/diagram.drawio')), {
					contentType: 'application/octet-stream',
				})
				.field({ content: JSON.stringify({ algorithm: 'rc.v1.aes-sha2', ciphertext: 'something' }) })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-file-type');
				});
		});
	});

	describe('/rooms.favorite', () => {
		let testChannel: IRoom;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should favorite the room when send favorite: true by roomName', async () => {
			const res = await request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomName: testChannelName,
					favorite: true,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
		it('should unfavorite the room when send favorite: false by roomName', async () => {
			const res = await request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomName: testChannelName,
					favorite: false,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
		it('should favorite the room when send favorite: true by roomId', async () => {
			const res = await request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					favorite: true,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});

		it('should unfavorite room when send favorite: false by roomId', async () => {
			const res = await request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					favorite: false,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});

		it('should return an error when send an invalid room', async () => {
			const res = await request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomId: 'foo',
					favorite: false,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
		});
	});

	describe('/rooms.nameExists', () => {
		let testChannel: IRoom;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should return 401 unauthorized when user is not logged in', async () => {
			const res = await request.get(api('rooms.nameExists')).expect('Content-Type', 'application/json').expect(401);

			expect(res.body).to.have.property('message');
		});

		it('should return true if this room name exists', async () => {
			const res = await request
				.get(api('rooms.nameExists'))
				.set(credentials)
				.query({
					roomName: testChannelName,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', true);
		});

		it('should return false if this room name does not exist', async () => {
			const res = await request
				.get(api('rooms.nameExists'))
				.set(credentials)
				.query({
					roomName: 'foo',
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', false);
		});

		it('should return an error when the require parameter (roomName) is not provided', async () => {
			const res = await request
				.get(api('rooms.nameExists'))
				.set(credentials)
				.query({
					roomId: 'foo',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
		});
	});

	describe('[/rooms.cleanHistory]', () => {
		let publicChannel: IRoom;
		let privateChannel: IRoom;
		let directMessageChannelId: IRoom['_id'];
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		beforeEach(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
			await updateSetting('Message_ShowDeletedStatus', true);

			publicChannel = (await createRoom({ type: 'c', name: `testeChannel${+new Date()}` })).body.channel;
			privateChannel = (await createRoom({ type: 'p', name: `testPrivateChannel${+new Date()}` })).body.group;
			directMessageChannelId = (await createRoom({ type: 'd', username: user.username })).body.room.rid;
		});

		afterEach(() =>
			Promise.all([
				deleteUser(user),
				deleteRoom({ type: 'c', roomId: publicChannel._id }),
				deleteRoom({ type: 'p', roomId: privateChannel._id }),
				deleteRoom({ type: 'd', roomId: directMessageChannelId }),
			]),
		);

		after(() => updateSetting('Message_ShowDeletedStatus', false));

		it('should return success when send a valid public channel', async () => {
			const res = await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
		it('should not count hidden or deleted messages when limit param is not sent', async () => {
			const res = await sendSimpleMessage({ roomId: publicChannel._id });
			await deleteMessage({ roomId: publicChannel._id, msgId: res.body.message._id });
			await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 0);
				});
		});
		it('should not count hidden or deleted messages when limit param is sent', async () => {
			const res = await sendSimpleMessage({ roomId: publicChannel._id });
			await deleteMessage({ roomId: publicChannel._id, msgId: res.body.message._id });
			await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
					limit: 2000,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 0);
				});
		});
		it('should successfully delete an image and thumbnail from public channel', (done) => {
			void request
				.post(api(`rooms.media/${publicChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const message = res.body.message as IMessage;
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message._id', message._id);
					expect(res.body).to.have.nested.property('message.rid', publicChannel._id);
					assert.isDefined(message.file);
					expect(res.body).to.have.nested.property('message.file._id', message.file._id);
					expect(res.body).to.have.nested.property('message.file.type', message.file.type);
				});

			void request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			void request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: publicChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
					expect(res.body.files).to.have.lengthOf(0);
				})
				.end(done);
		});

		it('should remove only files and file attachments when filesOnly is set to true', async () => {
			const message1Response = await sendSimpleMessage({ roomId: publicChannel._id });

			const mediaUploadResponse = await request
				.post(api(`rooms.media/${publicChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect(200);

			const message2Response = await request
				.post(api(`rooms.mediaConfirm/${publicChannel._id}/${mediaUploadResponse.body.file._id}`))
				.set(credentials)
				.send({ msg: 'message with file only' })
				.expect(200);

			await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
					filesOnly: true,
				})
				.expect(200);

			const res = await request.get(api('channels.messages')).set(credentials).query({ roomId: publicChannel._id }).expect(200);

			expect(res.body.messages).to.be.an('array');
			const messageIds = res.body.messages.map((m: IMessage) => m._id);
			expect(messageIds).to.contain(message1Response.body.message._id);
			expect(messageIds).to.contain(message2Response.body.message._id);
			const cleanedMessage = res.body.messages.find((m: { _id: any }) => m._id === message2Response.body.message._id);
			expect(cleanedMessage).to.exist;
			expect(cleanedMessage.file).to.be.undefined;
			expect(cleanedMessage.files?.length ?? 0).to.equal(0);
			expect((cleanedMessage.attachments ?? []).find((a: MessageAttachment) => isFileAttachment(a))).to.be.undefined;

			await request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: publicChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
					expect(res.body.files).to.have.lengthOf(0);
				});
		});

		it('should not remove quote attachments when filesOnly is set to true', async () => {
			const siteUrl = await getSettingValueById('Site_Url');
			const message1Response = await sendSimpleMessage({ roomId: publicChannel._id });
			const mediaResponse = await request
				.post(api(`rooms.media/${publicChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200);

			const message2Response = await request
				.post(api(`rooms.mediaConfirm/${publicChannel._id}/${mediaResponse.body.file._id}`))
				.set(credentials)
				.send({
					msg: new URL(`/${publicChannel.fname}?msg=${message1Response.body.message._id}`, siteUrl as string).toString(),
				})
				.expect(200);

			await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
					filesOnly: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: publicChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const message = (res.body.messages.find((m: { _id: any }) => m._id === message2Response.body.message._id) as IMessage) || null;
					expect(message).not.to.be.null;
					expect(message).to.have.property('attachments');
					const fileAttachment = message.attachments?.find((f) => isFileAttachment(f)) || null;
					expect(fileAttachment, 'Expected file attachments to be removed').to.be.null;
					const quoteAttachment = message.attachments?.find((f) => isQuoteAttachment(f)) || null;
					expect(quoteAttachment, 'Expected quote attachments to be present').not.to.be.null;
					expect(message.file).to.be.undefined;
					expect(message.files).to.satisfy((files: IMessage['files']) => files === undefined || files.length === 0);
				});
		});

		it('should return success when send a valid private channel', async () => {
			const res = await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: privateChannel._id,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
		it('should return success when send a valid Direct Message channel', async () => {
			const res = await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: directMessageChannelId,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
		it('should return not allowed error when try deleting messages with user without permission', async () => {
			const res = await request
				.post(api('rooms.cleanHistory'))
				.set(userCredentials)
				.send({
					roomId: directMessageChannelId,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});
		describe('test user is not part of room', async () => {
			beforeEach(async () => {
				await updatePermission('clean-channel-history', ['admin', 'user']);
			});

			afterEach(async () => {
				await updatePermission('clean-channel-history', ['admin']);
			});

			it('should return an error when the user with right privileges is not part of the room', async () => {
				await request
					.post(api('rooms.cleanHistory'))
					.set(userCredentials)
					.send({
						roomId: privateChannel._id,
						latest: '9999-12-31T23:59:59.000Z',
						oldest: '0001-01-01T00:00:00.000Z',
						limit: 2000,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'User does not have access to the room [error-not-allowed]');
					});
			});
		});
	});
	describe('[/rooms.info]', () => {
		let testChannel: IRoom;
		let testGroup: IRoom;
		let testDM: IRoom;
		const expectedKeys = ['_id', 'name', 'fname', 't', 'msgs', 'usersCount', 'u', 'ts', 'ro', 'sysMes', 'default', '_updatedAt'];
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		const testGroupName = `group.test.${Date.now()}-${Math.random()}`;
		let user: TestUser<IUser>;

		before(async () => {
			user = await createUser();
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
			testGroup = (await createRoom({ type: 'p', name: testGroupName })).body.group;
			testDM = (await createRoom({ type: 'd', username: user.username })).body.room;
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'd', roomId: testDM._id }),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				deleteRoom({ type: 'p', roomId: testGroup._id }),
				deleteUser(user),
			]),
		);

		it('should return the info about the created channel correctly searching by roomId', async () => {
			const res = await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('room').and.to.be.an('object');
			expect(res.body.room).to.have.keys(expectedKeys);
		});
		it('should return the info about the created channel correctly searching by roomName', async () => {
			const res = await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomName: testChannel.name,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('room').and.to.be.an('object');
			expect(res.body.room).to.have.all.keys(expectedKeys);
		});
		it('should return the info about the created group correctly searching by roomId', async () => {
			const res = await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('room').and.to.be.an('object');
			expect(res.body.room).to.have.all.keys(expectedKeys);
		});
		it('should return the info about the created group correctly searching by roomName', async () => {
			const res = await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomName: testGroup.name,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('room').and.to.be.an('object');
			expect(res.body.room).to.have.all.keys(expectedKeys);
		});
		it('should return the info about the created DM correctly searching by roomId', async () => {
			const res = await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testDM._id,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('room').and.to.be.an('object');
		});

		it('should not return parent & team for room thats not on a team nor is a discussion', async () => {
			await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.not.have.property('team');
					expect(res.body.room).to.not.have.property('prid');
				});
		});

		describe('with team and parent data', () => {
			const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
			const teamName = `test-team-${Date.now()}`;
			const discussionName = `test-discussion-${Date.now()}`;
			const testChannelOutsideTeamname = `channel.test.outside.${Date.now()}-${Math.random()}`;
			let testChannel: IRoom;
			let testDiscussion: IRoom;
			let testDiscussionMainRoom: IRoom;
			let testTeam: ITeam;
			let testChannelOutside: IRoom;
			let testDiscussionOutsideTeam: IRoom;

			before(async () => {
				testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;

				const teamResponse = await request.post(api('teams.create')).set(credentials).send({ name: teamName, type: 1 }).expect(200);
				testTeam = teamResponse.body.team;

				const resDiscussion = await request.post(api('rooms.createDiscussion')).set(credentials).send({
					prid: testChannel._id,
					t_name: discussionName,
				});
				testDiscussion = resDiscussion.body.discussion;

				testDiscussionMainRoom = (
					await request
						.post(api('rooms.createDiscussion'))
						.set(credentials)
						.send({
							prid: testTeam.roomId,
							t_name: `test-discussion-${Date.now()}-team`,
						})
				).body.discussion;

				await request
					.post(api('teams.addRooms'))
					.set(credentials)
					.send({ rooms: [testChannel._id], teamId: testTeam._id });
			});

			before(async () => {
				testChannelOutside = (await createRoom({ type: 'c', name: testChannelOutsideTeamname })).body.channel;
				testDiscussionOutsideTeam = (
					await request
						.post(api('rooms.createDiscussion'))
						.set(credentials)
						.send({
							prid: testChannelOutside._id,
							t_name: `test-discussion-${Date.now()}`,
						})
				).body.discussion;
			});

			after(() =>
				Promise.all([
					deleteRoom({ type: 'c', roomId: testChannel._id }),
					deleteRoom({ type: 'p', roomId: testDiscussion._id }),
					deleteRoom({ type: 'c', roomId: testChannelOutside._id }),
					deleteRoom({ type: 'p', roomId: testDiscussionOutsideTeam._id }),
					deleteRoom({ type: 'p', roomId: testDiscussionMainRoom._id }),
					deleteTeam(credentials, teamName),
				]),
			);

			it('should return the channel info, team and parent info', async () => {
				const result = await request.get(api('rooms.info')).set(credentials).query({ roomId: testChannel._id }).expect(200);

				expect(result.body).to.have.property('success', true);
				expect(result.body).to.have.property('team');
				expect(result.body).to.have.property('parent');
				expect(result.body.parent).to.have.property('_id').and.to.equal(testTeam.roomId);
			});

			it('should return the dicsussion room info and parent info', async () => {
				await request
					.get(api('rooms.info'))
					.set(credentials)
					.query({ roomId: testDiscussion._id })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('parent').and.to.be.an('object');
						expect(res.body.parent).to.have.property('_id').and.to.be.equal(testChannel._id);
					});
			});

			it('should not return parent info for the main room of the team', async () => {
				await request
					.get(api('rooms.info'))
					.set(credentials)
					.query({ roomId: testTeam.roomId })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.property('parent');
						expect(res.body).to.have.property('team');
					});
			});

			it('should not return team for room outside team', async () => {
				await request
					.get(api('rooms.info'))
					.set(credentials)
					.query({ roomId: testChannelOutside._id })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.property('team');
						expect(res.body).to.not.have.property('parent');
					});
			});

			it('should return the parent for discussion outside team', async () => {
				await request
					.get(api('rooms.info'))
					.set(credentials)
					.query({ roomId: testDiscussionOutsideTeam._id })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('parent').and.to.be.an('object');
						expect(res.body.parent).to.have.property('_id').and.to.be.equal(testChannelOutside._id);
						expect(res.body).to.not.have.property('team');
					});
			});

			it('should return the parent for a discussion created from team main room', async () => {
				await request
					.get(api('rooms.info'))
					.set(credentials)
					.query({ roomId: testDiscussionMainRoom._id })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('parent').and.to.be.an('object');
						expect(res.body.parent).to.have.property('_id').and.to.be.equal(testTeam.roomId);
						expect(res.body).to.not.have.property('team');
					});
			});
		});

		describe('with archived rooms', () => {
			let publicArchivedChannel: IRoom;
			let privateArchivedGroup: IRoom;
			let nonMember: TestUser<IUser>;
			let nonMemberCredentials: Credentials;

			before(async () => {
				publicArchivedChannel = (await createRoom({ type: 'c', name: `rooms.info.archived.c.${Date.now()}-${Math.random()}` })).body
					.channel;
				privateArchivedGroup = (await createRoom({ type: 'p', name: `rooms.info.archived.p.${Date.now()}-${Math.random()}` })).body.group;

				await request.post(api('channels.archive')).set(credentials).send({ roomId: publicArchivedChannel._id }).expect(200);
				await request.post(api('groups.archive')).set(credentials).send({ roomId: privateArchivedGroup._id }).expect(200);

				nonMember = await createUser({ joinDefaultChannels: false });
				nonMemberCredentials = await login(nonMember.username, password);
			});

			after(() =>
				Promise.all([
					deleteRoom({ type: 'c', roomId: publicArchivedChannel._id }),
					deleteRoom({ type: 'p', roomId: privateArchivedGroup._id }),
					deleteUser(nonMember),
				]),
			);

			it('should return an accessible archived public channel to a non-member (reached via link/mention)', async () => {
				await request
					.get(api('rooms.info'))
					.set(nonMemberCredentials)
					.query({ roomId: publicArchivedChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room').and.to.be.an('object');
						expect(res.body.room).to.have.property('_id', publicArchivedChannel._id);
						expect(res.body.room).to.have.property('archived', true);
					});
			});

			it('should still reject an archived room the user cannot access (private group, non-member)', async () => {
				await request
					.get(api('rooms.info'))
					.set(nonMemberCredentials)
					.query({ roomId: privateArchivedGroup._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'not-allowed');
					});
			});
		});
	});
	describe('[/rooms.leave]', () => {
		let testChannel: IRoom;
		let testGroup: IRoom;
		let testDM: IRoom;
		let user2: TestUser<IUser>;
		let user2Credentials: Credentials;
		const testChannelName = `channel.leave.${Date.now()}-${Math.random()}`;
		const testGroupName = `group.leave.${Date.now()}-${Math.random()}`;

		before(async () => {
			user2 = await createUser();
			user2Credentials = await login(user2.username, password);
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
			testGroup = (await createRoom({ type: 'p', name: testGroupName })).body.group;
			testDM = (await createRoom({ type: 'd', username: user2.username })).body.room;
			await updateSetting('API_User_Limit', 1000000);
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'd', roomId: testDM._id }),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				deleteRoom({ type: 'p', roomId: testGroup._id }),
				updatePermission('leave-c', ['admin', 'user', 'bot', 'anonymous', 'app']),
				updatePermission('leave-p', ['admin', 'user', 'bot', 'anonymous', 'app']),
				deleteUser(user2),
				updateSetting('API_User_Limit', 10000),
			]),
		);

		it('should return an Error when trying leave a DM room', async () => {
			const res = await request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testDM._id,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});
		it('should return an Error when trying to leave a public channel and you are the last owner', async () => {
			const res = await request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-you-are-last-owner');
		});
		it('should return an Error when trying to leave a private group and you are the last owner', async () => {
			const res = await request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-you-are-last-owner');
		});
		it('should return an Error when trying to leave a public channel and not have the necessary permission(leave-c)', async () => {
			await updatePermission('leave-c', []);

			const res = await request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});
		it('should return an Error when trying to leave a private group and not have the necessary permission(leave-p)', async () => {
			await updatePermission('leave-p', []);

			const res = await request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});
		it('should leave the public channel when the room has at least another owner and the user has the necessary permission(leave-c)', async () => {
			await updatePermission('leave-c', ['admin']);
			await request.post(api('channels.addAll')).set(credentials).send({
				roomId: testChannel._id,
			});

			await request.post(api('channels.addOwner')).set(credentials).send({
				roomId: testChannel._id,
				userId: user2._id,
			});

			await request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request.post(api('channels.addOwner')).set(user2Credentials).send({
				roomId: testChannel._id,
				userId: credentials['X-User-Id'],
			});
		});
		it('should leave the private group when the room has at least another owner and the user has the necessary permission(leave-p)', async () => {
			await updatePermission('leave-p', ['user']);
			await request.post(api('groups.addAll')).set(credentials).send({
				roomId: testGroup._id,
			});
			await request.post(api('groups.addOwner')).set(credentials).send({
				roomId: testGroup._id,
				userId: user2._id,
			});
			await request
				.post(api('rooms.leave'))
				.set(user2Credentials)
				.send({
					roomId: testGroup._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	describe('/rooms.createDiscussion', () => {
		let testChannel: IRoom;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		let messageSent: IMessage;
		let privateTeam: ITeam;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
			messageSent = (
				await sendSimpleMessage({
					roomId: testChannel._id,
				})
			).body.message;
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updateSetting('Discussion_enabled', true),
				updatePermission('start-discussion', ['admin', 'user', 'guest', 'app']),
				updatePermission('start-discussion-other-user', ['admin', 'user', 'guest', 'app']),
				deleteTeam(credentials, privateTeam.name),
			]),
		);

		it('should throw an error when the user tries to create a discussion and the feature is disabled', (done) => {
			void updateSetting('Discussion_enabled', false).then(() => {
				void request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: 'valid name',
					})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
					})
					.end(() => updateSetting('Discussion_enabled', true).then(done));
			});
		});
		it('should throw an error when the user tries to create a discussion and does not have at least one of the required permissions', (done) => {
			void updatePermission('start-discussion', []).then(() => {
				void updatePermission('start-discussion-other-user', []).then(() => {
					void request
						.post(api('rooms.createDiscussion'))
						.set(credentials)
						.send({
							prid: testChannel._id,
							t_name: 'valid name',
						})
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
						})
						.end(() => {
							void updatePermission('start-discussion', ['admin', 'user', 'guest'])
								.then(() => updatePermission('start-discussion-other-user', ['admin', 'user', 'guest']))
								.then(done);
						});
				});
			});
		});
		it('should throw an error when the user tries to create a discussion without the required parameter "prid"', async () => {
			const res = await request.post(api('rooms.createDiscussion')).set(credentials).send({}).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error').that.includes("must have required property 'prid'");
		});
		it('should throw an error when the user tries to create a discussion without the required parameter "t_name"', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error').that.includes("must have required property 't_name'");
		});
		it('should throw an error when the user tries to create a discussion with the required parameter invalid "users"(different from an array)', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: 'valid name',
					users: 'invalid-type-of-users',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error').that.includes('must be array');
		});
		it("should throw an error when the user tries to create a discussion with the channel's id invalid", async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: 'invalid-id',
					t_name: 'valid name',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-invalid-room');
		});
		it("should throw an error when the user tries to create a discussion with the message's id invalid", async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: 'valid name',
					pmid: 'invalid-message',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-invalid-message');
		});
		it('should create a discussion successfully when send only the required parameters', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('discussion').and.to.be.an('object');
			expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
			expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "reply"', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
					reply: 'reply from discussion tests',
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('discussion').and.to.be.an('object');
			expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
			expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "users"', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
					reply: 'reply from discussion tests',
					users: ['rocket.cat'],
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('discussion').and.to.be.an('object');
			expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
			expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "pmid"', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
					reply: 'reply from discussion tests',
					users: ['rocket.cat'],
					pmid: messageSent._id,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('discussion').and.to.be.an('object');
			expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
			expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
		});

		describe('it should create a *private* discussion if the parent channel is public and inside a private team', async () => {
			it('should create a team', async () => {
				const res = await request
					.post(api('teams.create'))
					.set(credentials)
					.send({
						name: `test-team-${Date.now()}`,
						type: 1,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('team');
				expect(res.body).to.have.nested.property('team._id');
				privateTeam = res.body.team;
			});

			it('should add the public channel to the team', async () => {
				const res = await request
					.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [testChannel._id],
						teamId: privateTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(res.body).to.have.property('success');
			});

			it('should create a private discussion inside the public channel', async () => {
				const res = await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: `discussion-create-from-tests-${testChannel.name}-team`,
					})
					.expect(200);

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('discussion').and.to.be.an('object');
				expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
				expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}-team`);
				expect(res.body.discussion).to.have.property('t').and.to.be.equal('p');
			});
		});

		describe('E2E forced encryption for private rooms', () => {
			let unencryptedPrivateParent: IRoom;
			let encryptedPrivateParent: IRoom;
			let createdDiscussionId: IRoom['_id'] | undefined;

			before(async () => {
				// the unencrypted private parent must exist before the policy is enforced
				unencryptedPrivateParent = (await createRoom({ type: 'p', name: `unencrypted-parent-${Date.now()}` })).body.group;
				await Promise.all([updateSetting('E2E_Enable', true), updateSetting('E2E_Force_Encryption_For_Private_Rooms', true)]);
				encryptedPrivateParent = (await createRoom({ type: 'p', name: `encrypted-parent-${Date.now()}`, extraData: { encrypted: true } }))
					.body.group;
			});

			after(async () => {
				await Promise.all([
					updateSetting('E2E_Enable', false),
					updateSetting('E2E_Force_Encryption_For_Private_Rooms', false),
					...(unencryptedPrivateParent?._id ? [deleteRoom({ type: 'p', roomId: unencryptedPrivateParent._id })] : []),
					...(encryptedPrivateParent?._id ? [deleteRoom({ type: 'p', roomId: encryptedPrivateParent._id })] : []),
					...(createdDiscussionId ? [deleteRoom({ type: 'p', roomId: createdDiscussionId })] : []),
				]);
			});

			it('should reject creating a discussion in an unencrypted private room when private room encryption is forced', async () => {
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: unencryptedPrivateParent._id,
						t_name: `forced-discussion-${Date.now()}`,
					})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-encrypted-private-rooms-enforced-discussion');
					});
			});

			it('should create an encrypted discussion in an encrypted private room when private room encryption is forced', async () => {
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: encryptedPrivateParent._id,
						t_name: `forced-discussion-encrypted-${Date.now()}`,
					})
					.expect(200)
					.expect((res) => {
						createdDiscussionId = res.body.discussion?._id;
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('discussion.t', 'p');
						expect(res.body).to.have.nested.property('discussion.encrypted', true);
					});
			});
		});
	});

	describe('/rooms.getDiscussions', () => {
		let testChannel: IRoom;
		const testChannelName = `channel.test.getDiscussions${Date.now()}-${Math.random()}`;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: testChannelName })).body.channel;
			await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
				});
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
			]),
		);

		it('should throw an error when the user tries to gets a list of discussion without a required parameter "roomId"', async () => {
			const res = await request.get(api('rooms.getDiscussions')).set(credentials).query({}).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error', 'The parameter "roomId" or "roomName" is required [error-roomid-param-not-provided]');
		});
		it('should throw an error when the user tries to gets a list of discussion and he cannot access the room', (done) => {
			void updatePermission('view-c-room', []).then(() => {
				void request
					.get(api('rooms.getDiscussions'))
					.set(credentials)
					.query({})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Not Allowed');
					})
					.end(() => updatePermission('view-c-room', ['admin', 'user', 'bot', 'anonymous']).then(done));
			});
		});
		it('should return a list of discussions with ONE discussion', async () => {
			const res = await request
				.get(api('rooms.getDiscussions'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('discussions').and.to.be.an('array');
			expect(res.body.discussions).to.have.lengthOf(1);
		});
	});

	describe('discussion messages count', () => {
		let testChannel: IRoom;
		let discussion: IRoom;

		const getDiscussionMessage = async () => {
			const { body } = await request.get(api('chat.getDiscussions')).set(credentials).query({ roomId: testChannel._id }).expect(200);

			return body.messages.find((message: IMessage & { drid: IRoom['_id'] }) => message.drid === discussion._id);
		};

		const saveDiscussionSettings = (settings: Record<string, unknown>) =>
			request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({ rid: discussion._id, ...settings })
				.expect('Content-Type', 'application/json')
				.expect(200);

		beforeEach(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` })).body.channel;

			const { body } = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({ prid: testChannel._id, t_name: `discussion.test.${Date.now()}-${Math.random()}` })
				.expect(200);

			discussion = body.discussion;
		});

		// deleting the parent channel also deletes its discussions
		afterEach(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		describe('with no system message hidden', () => {
			it('should count the message just sent on the discussion', async () => {
				const sentMessage = await sendSimpleMessage({ roomId: discussion._id });
				const discussionMessage = await getDiscussionMessage();

				expect(discussionMessage).to.have.property('dcount', 1);
				expect(discussionMessage).to.have.property('dlm', sentMessage.body.message.ts);
			});

			it('should count the system messages of the discussion', async () => {
				await saveDiscussionSettings({ roomName: `edited-discussion-name-${Date.now()}` });
				expect(await getDiscussionMessage()).to.have.property('dcount', 1);
			});
		});

		describe('with system messages hidden on the discussion', () => {
			beforeEach(() => saveDiscussionSettings({ systemMessages: ['r'] }));

			it('should not count the hidden system messages', async () => {
				await saveDiscussionSettings({ roomName: `edited-discussion-name-${Date.now()}` });
				await sendSimpleMessage({ roomId: discussion._id });

				expect(await getDiscussionMessage()).to.have.property('dcount', 1);
			});

			it('should count them again once they are not hidden anymore', async () => {
				await saveDiscussionSettings({ roomName: `edited-discussion-name-${Date.now()}` });
				expect(await getDiscussionMessage()).to.have.property('dcount', 0);

				await saveDiscussionSettings({ systemMessages: [] });

				expect(await getDiscussionMessage()).to.have.property('dcount', 1);
			});
		});

		describe('with system messages hidden by the global setting', () => {
			before(() => updateSetting('Hide_System_Messages', ['r']));

			// the setting applies to the whole workspace, so it has to be restored
			after(() => updateSetting('Hide_System_Messages', []));

			it('should not count the hidden system messages', async () => {
				await saveDiscussionSettings({ roomName: `edited-discussion-name-${Date.now()}` });
				expect(await getDiscussionMessage()).to.have.property('dcount', 0);

				await sendSimpleMessage({ roomId: discussion._id });

				expect(await getDiscussionMessage()).to.have.property('dcount', 1);
			});
		});
	});

	describe('[/rooms.join]', () => {
		let testChannel: IRoom;
		let testGroup: IRoom;
		let testChannelWithCode: IRoom;
		let testDiscussion: IRoom;
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;

		before(async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			testChannel = (await createRoom({ type: 'c', name: `rooms.join.channel.${Date.now()}` })).body.channel;
			testGroup = (await createRoom({ type: 'p', name: `rooms.join.group.${Date.now()}` })).body.group;
			testChannelWithCode = (await createRoom({ type: 'c', name: `rooms.join.code.${Date.now()}` })).body.channel;
			testDiscussion = (
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({ prid: testChannel._id, t_name: `rooms.join.discussion.${Date.now()}` })
			).body.discussion;
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				deleteRoom({ type: 'p', roomId: testGroup._id }),
				deleteRoom({ type: 'c', roomId: testChannelWithCode._id }),
				deleteUser(testUser),
				updatePermission('join-without-join-code', ['admin', 'bot', 'app']),
			]),
		);

		it('should fail when the room does not exist', async () => {
			const res = await request
				.post(api('rooms.join'))
				.set(testUserCredentials)
				.send({ roomId: 'invalid-room-id' })
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-room-not-found');
		});

		it('should join a public channel by roomId', async () => {
			const res = await request
				.post(api('rooms.join'))
				.set(testUserCredentials)
				.send({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.nested.property('room._id', testChannel._id);
		});

		it('should join a public channel by roomName', async () => {
			const res = await request
				.post(api('rooms.join'))
				.set(testUserCredentials)
				.send({ roomName: testChannel.name })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.nested.property('room._id', testChannel._id);
		});

		it('should join a discussion (a room with a parent room) by roomId', async () => {
			const res = await request
				.post(api('rooms.join'))
				.set(testUserCredentials)
				.send({ roomId: testDiscussion._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.nested.property('room._id', testDiscussion._id);
			expect(res.body).to.have.nested.property('room.prid', testChannel._id);
		});

		it('should fail to join a private group the user cannot access', async () => {
			const res = await request
				.post(api('rooms.join'))
				.set(testUserCredentials)
				.send({ roomId: testGroup._id })
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});

		describe('with a join code', () => {
			before(async () => {
				await request.post(api('channels.setJoinCode')).set(credentials).send({ roomId: testChannelWithCode._id, joinCode: '123' });
				await updatePermission('join-without-join-code', []);
			});

			it('should fail to join without a join code', async () => {
				const res = await request
					.post(api('rooms.join'))
					.set(testUserCredentials)
					.send({ roomId: testChannelWithCode._id })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('errorType', 'error-code-required');
			});

			it('should fail to join with an incorrect join code', async () => {
				const res = await request
					.post(api('rooms.join'))
					.set(testUserCredentials)
					.send({ roomId: testChannelWithCode._id, joinCode: 'WRONG' })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('errorType', 'error-code-invalid');
			});

			it('should join with the correct join code', async () => {
				const res = await request
					.post(api('rooms.join'))
					.set(testUserCredentials)
					.send({ roomId: testChannelWithCode._id, joinCode: '123' })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('room._id', testChannelWithCode._id);
			});
		});
	});

	describe('[/rooms.autocomplete.channelAndPrivate]', () => {
		let testChannel: IRoom;

		before(async () => {
			await updateSetting('UI_Allow_room_names_with_special_chars', true);
			testChannel = (await createRoom({ type: 'c', name: 'тест' })).body.channel;
		});

		after(async () => {
			await updateSetting('UI_Allow_room_names_with_special_chars', true);
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should return an error when the required parameter "selector" is not provided', async () => {
			const res = await request
				.get(api('rooms.autocomplete.channelAndPrivate'))
				.set(credentials)
				.query({})
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.include("must have required property 'selector'");
		});
		it('should return the rooms to fill auto complete', async () => {
			const res = await request
				.get(api('rooms.autocomplete.channelAndPrivate'))
				.query({ selector: '{}' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
		});
		it('should return the rooms with cyrillic characters in channel name', async () => {
			const res = await request
				.get(api('rooms.autocomplete.channelAndPrivate'))
				.query({ selector: '{ "name": "тест" }' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
			expect(res.body.items).to.have.lengthOf(1);
			expect(res.body.items[0].fname).to.be.equal('тест');
		});
	});

	describe('[/rooms.autocomplete.channelAndPrivate.withPagination]', () => {
		it('should return an error when the required parameter "selector" is not provided', async () => {
			const res = await request
				.get(api('rooms.autocomplete.channelAndPrivate.withPagination'))
				.set(credentials)
				.query({})
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.include("must have required property 'selector'");
		});
		it('should return the rooms to fill auto complete', async () => {
			const res = await request
				.get(api('rooms.autocomplete.channelAndPrivate.withPagination'))
				.query({ selector: '{}' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
			expect(res.body).to.have.property('total');
		});
		it('should return the rooms to fill auto complete even requested with count and offset params', async () => {
			const res = await request
				.get(api('rooms.autocomplete.channelAndPrivate.withPagination'))
				.query({ selector: '{}' })
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
			expect(res.body).to.have.property('total');
		});
	});

	describe('[/rooms.autocomplete.availableForTeams]', () => {
		it('should return the rooms to fill auto complete', async () => {
			const res = await request
				.get(api('rooms.autocomplete.availableForTeams'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
		});
		it('should return the filtered rooms to fill auto complete', async () => {
			const res = await request
				.get(api('rooms.autocomplete.availableForTeams'))
				.query({ name: 'group' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
		});
	});

	describe('[/rooms.autocomplete.adminRooms]', () => {
		let testGroup: IRoom;
		const testGroupName = `channel.test.adminRoom${Date.now()}-${Math.random()}`;
		const name = {
			name: testGroupName,
		};

		before(async () => {
			testGroup = (await createRoom({ type: 'p', name: testGroupName })).body.group;
			await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testGroup._id,
					t_name: `${testGroupName}-discussion`,
				});
		});

		after(() => Promise.all([deleteRoom({ type: 'p', roomId: testGroup._id }), updateEEPermission('can-audit', ['admin', 'auditor'])]));

		(IS_EE ? it : it.skip)('should return an error when the required parameter "selector" is not provided', (done) => {
			void updateEEPermission('can-audit', ['admin']).then(() => {
				void request
					.get(api('rooms.autocomplete.adminRooms'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.include("must have required property 'selector'");
					})
					.end(done);
			});
		});
		it('should return the rooms to fill auto complete', async () => {
			const res = await request
				.get(api('rooms.autocomplete.adminRooms'))
				.query({ selector: '{}' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
		});
		it('should return the rooms to fill auto complete', async () => {
			const res = await request
				.get(api('rooms.autocomplete.adminRooms'))
				.set(credentials)
				.query({
					selector: JSON.stringify(name),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('items').and.to.be.an('array');
			expect(res.body).to.have.property('items').that.have.lengthOf(2);
		});
	});

	describe('/rooms.adminRooms', () => {
		const suffix = `test-${Date.now()}`;
		const fnameRoom = `Ελληνικά-${suffix}`;
		const nameRoom = `Ellinika-${suffix}`;
		const discussionRoomName = `${nameRoom}-discussion`;

		let testGroup: IRoom;

		before(async () => {
			await updateSetting('UI_Allow_room_names_with_special_chars', true);
			testGroup = (await createRoom({ type: 'p', name: fnameRoom })).body.group;
			await request.post(api('rooms.createDiscussion')).set(credentials).send({
				prid: testGroup._id,
				t_name: discussionRoomName,
			});
		});

		after(() =>
			Promise.all([
				updateSetting('UI_Allow_room_names_with_special_chars', false),
				deleteRoom({ type: 'p', roomId: testGroup._id }),
				updatePermission('view-room-administration', ['admin']),
			]),
		);

		it('should throw an error when the user tries to gets a list of discussion and he cannot access the room', (done) => {
			void updatePermission('view-room-administration', []).then(() => {
				void request
					.get(api('rooms.adminRooms'))
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(() => updatePermission('view-room-administration', ['admin']).then(done));
			});
		});
		it('should return a list of admin rooms', async () => {
			const res = await request.get(api('rooms.adminRooms')).set(credentials).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body).to.have.property('offset');
			expect(res.body).to.have.property('total');
			expect(res.body).to.have.property('count');
		});
		it('should return a list of admin rooms even requested with count and offset params', async () => {
			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body).to.have.property('offset');
			expect(res.body).to.have.property('total');
			expect(res.body).to.have.property('count');
		});
		it('should search the list of admin rooms using non-latin characters when UI_Allow_room_names_with_special_chars setting is toggled', async () => {
			await updateSetting('UI_Allow_room_names_with_special_chars', true);

			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: fnameRoom,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf(1);
			expect(res.body.rooms[0].fname).to.be.equal(fnameRoom);
			expect(res.body).to.have.property('offset');
			expect(res.body).to.have.property('total');
			expect(res.body).to.have.property('count');
		});
		it('should search the list of admin rooms using latin characters only when UI_Allow_room_names_with_special_chars setting is disabled', async () => {
			await updateSetting('UI_Allow_room_names_with_special_chars', false);

			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf(1);
			expect(res.body.rooms[0].name).to.be.equal(nameRoom);
			expect(res.body).to.have.property('offset');
			expect(res.body).to.have.property('total');
			expect(res.body).to.have.property('count');
		});
		it('should filter by only rooms types', async () => {
			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					types: ['p'],
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf.at.least(1);
			expect(res.body.rooms[0].t).to.be.equal('p');
			expect((res.body.rooms as IRoom[]).find((room) => room.name === nameRoom)).to.exist;
			expect((res.body.rooms as IRoom[]).find((room) => room.name === discussionRoomName)).to.not.exist;
		});
		it('should filter by only name', async () => {
			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf(1);
			expect(res.body.rooms[0].name).to.be.equal(nameRoom);
		});
		it('should filter by type and name at the same query', async () => {
			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
					types: ['p'],
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf(1);
			expect(res.body.rooms[0].name).to.be.equal(nameRoom);
		});
		it('should return an empty array when filter by wrong type and correct room name', async () => {
			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
					types: ['c'],
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf(0);
		});
		it('should return an array sorted by "ts" property', async () => {
			const res = await request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					sort: JSON.stringify({
						ts: -1,
					}),
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');
			expect(res.body.rooms).to.have.lengthOf.at.least(1);
			expect(res.body.rooms[0]).to.have.property('ts').that.is.a('string');
		});
		it('should return the customFields of a private room', async () => {
			const roomCustomFields = { department: 'engineering', priority: 'high' };

			await request.post(api('rooms.saveRoomSettings')).set(credentials).send({ rid: testGroup._id, roomCustomFields }).expect(200);

			const res = await request.get(api('rooms.adminRooms')).set(credentials).query({ filter: nameRoom }).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.rooms).to.have.lengthOf(1);
			expect(res.body.rooms[0]._id).to.equal(testGroup._id);
			expect(res.body.rooms[0]).to.have.property('customFields').that.deep.equals(roomCustomFields);
		});
	});

	describe('/rooms.adminRooms.privateRooms', () => {
		let publicChannel: IRoom;
		let privateGroup: IRoom;
		let publicTeam: ITeam;
		let privateTeam: ITeam;

		before(async () => {
			await updatePermission('view-room-administration', ['admin']);

			publicChannel = (await createRoom({ type: 'c', name: `public-channel-${Date.now()}` })).body.channel;
			privateGroup = (await createRoom({ type: 'p', name: `private-group-${Date.now()}` })).body.group;

			publicTeam = await createTeam(credentials, `public-team-${Date.now()}`, TeamType.PUBLIC);
			privateTeam = await createTeam(credentials, `private-team-${Date.now()}`, TeamType.PRIVATE);
		});

		after(async () => {
			await Promise.all([
				deleteRoom({ type: 'c', roomId: publicChannel._id }),
				deleteRoom({ type: 'p', roomId: privateGroup._id }),
				deleteTeam(credentials, publicTeam.name),
				deleteTeam(credentials, privateTeam.name),
			]);
		});

		it('should return only the private room when filtering by its name', async () => {
			const res = await request
				.get(api('rooms.adminRooms.privateRooms'))
				.set(credentials)
				.query({
					filter: privateGroup.name,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');

			const rooms = res.body.rooms as IRoom[];
			expect(rooms).to.have.lengthOf(1);
			expect(rooms[0].name).to.equal(privateGroup.name);
			expect(rooms[0].t).to.equal('p');
		});

		it('should return only the private team main when filtering by its name', async () => {
			const res = await request
				.get(api('rooms.adminRooms.privateRooms'))
				.set(credentials)
				.query({
					filter: privateTeam.name,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('rooms').and.to.be.an('array');

			const rooms = res.body.rooms as IRoom[];
			expect(rooms).to.have.lengthOf(1);
			expect(rooms[0].name).to.equal(privateTeam.name);
			expect(rooms[0].t).to.equal('p');
		});

		it('should not return public rooms or public team mains even when filtering by their names', async () => {
			const resPublicChannel = await request
				.get(api('rooms.adminRooms.privateRooms'))
				.set(credentials)
				.query({
					filter: publicChannel.name,
				})
				.expect(200);

			expect(resPublicChannel.body).to.have.property('success', true);
			expect(resPublicChannel.body).to.have.property('rooms').and.to.be.an('array');
			expect(resPublicChannel.body.rooms).to.have.lengthOf(0);

			const resPublicTeam = await request
				.get(api('rooms.adminRooms.privateRooms'))
				.set(credentials)
				.query({
					filter: publicTeam.name,
				})
				.expect(200);

			expect(resPublicTeam.body).to.have.property('success', true);
			expect(resPublicTeam.body).to.have.property('rooms').and.to.be.an('array');
			expect(resPublicTeam.body.rooms).to.have.lengthOf(0);
		});

		describe('permissions', () => {
			before(async () => {
				await updatePermission('view-room-administration', []);
			});

			after(async () => {
				await updatePermission('view-room-administration', ['admin']);
			});

			it('should return an error for users without view-room-administration permission', async () => {
				const res = await request.get(api('rooms.adminRooms.privateRooms')).set(credentials).expect(403);

				expect(res.body).to.have.property('success', false);
			});
		});
	});

	describe('/rooms.adminRooms.getRoom', () => {
		let roomOwner: TestUser<IUser>;
		let ownerCredentials: Credentials;
		let privateRoom: IRoom;
		const roomCustomFields = { department: 'engineering', priority: 'high' };

		before(async () => {
			await updatePermission('view-room-administration', ['admin']);

			roomOwner = await createUser();
			ownerCredentials = await login(roomOwner.username, password);
			privateRoom = (await createRoom({ type: 'p', name: `admin-getroom-${Date.now()}`, credentials: ownerCredentials })).body.group;

			await request.post(api('rooms.saveRoomSettings')).set(credentials).send({ rid: privateRoom._id, roomCustomFields }).expect(200);
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'p', roomId: privateRoom._id }),
				deleteUser(roomOwner),
				updatePermission('view-room-administration', ['admin']),
			]),
		);

		it('should not expose the private room through groups.info to an admin that is not a member', async () => {
			const res = await request.get(api('groups.info')).set(credentials).query({ roomId: privateRoom._id });

			expect(res.body).to.have.property('success', false);
		});

		it('should return the private room customFields for an admin that is not a member', async () => {
			const res = await request.get(api('rooms.adminRooms.getRoom')).set(credentials).query({ rid: privateRoom._id }).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('_id', privateRoom._id);
			expect(res.body).to.have.property('t', 'p');
			expect(res.body).to.have.property('customFields').that.deep.equals(roomCustomFields);
		});

		it('should return an error for users without view-room-administration permission', async () => {
			await updatePermission('view-room-administration', []);

			const res = await request.get(api('rooms.adminRooms.getRoom')).set(credentials).query({ rid: privateRoom._id }).expect(400);

			expect(res.body).to.have.property('success', false);

			await updatePermission('view-room-administration', ['admin']);
		});
	});

	describe('update group dms name', () => {
		let testUser: TestUser<IUser>;
		let roomId: IRoom['_id'];
		let testUser2: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();

			const usernames = [testUser.username, testUser2.username].join(',');

			const result = await request.post(api('dm.create')).set(credentials).send({
				usernames,
			});

			roomId = result.body.room.rid;
		});

		after(async () =>
			Promise.all([
				updateSetting('UI_Use_Real_Name', false),
				deleteRoom({ type: 'd', roomId }),
				deleteUser(testUser),
				deleteUser(testUser2),
			]),
		);

		const expectSubscriptionFieldToEqual = async (field: 'name' | 'fname', expected: string) => {
			for (let attempt = 0; ; attempt++) {
				const { body } = await request.get(api('subscriptions.getOne')).set(credentials).query({ roomId });
				if (body.subscription?.[field] === expected || attempt >= 20) {
					expect(body.subscription?.[field]).to.equal(expected);
					return;
				}
				await sleep(250);
			}
		};

		it('should update group name if user changes username', async () => {
			await updateSetting('UI_Use_Real_Name', false);
			await request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: testUser._id,
					data: {
						username: `changed.username.${testUser.username}`,
					},
				});

			await expectSubscriptionFieldToEqual('name', `changed.username.${testUser.username},${testUser2.username}`);
		});

		describe('use real name', () => {
			before(async () => {
				await updateSetting('UI_Use_Real_Name', true);
			});

			after(async () => {
				await updateSetting('UI_Use_Real_Name', false);
			});

			it('should update group name if user changes name', async () => {
				await request
					.post(api('users.update'))
					.set(credentials)
					.send({
						userId: testUser._id,
						data: {
							name: `changed.name.${testUser.username}`,
						},
					});

				await expectSubscriptionFieldToEqual('fname', `changed.name.${testUser.username}, ${testUser2.name}`);
			});
		});
	});

	describe('/rooms.delete', () => {
		let testChannel: IRoom;
		let testTeam: ITeam;
		let testUser: IUser;
		let testUser2: IUser;
		let userCredentials: Credentials;

		before('create channel and team', async () => {
			testUser = await createUser();
			testUser2 = await createUser();
			userCredentials = await login(testUser.username, password);

			const {
				body: { channel },
			} = await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` });
			testChannel = channel;
			testTeam = await createTeam(userCredentials, `team.test.${Date.now()}-${Math.random()}`, TeamType.PUBLIC, [
				testUser.username as string,
				testUser2.username as string,
			]);
		});

		after('delete channel and team', async () => {
			await deleteTeam(userCredentials, testTeam.name);
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should throw an error when roomId is not provided', async () => {
			const res = await request.post(api('rooms.delete')).set(credentials).send({}).expect('Content-Type', 'application/json').expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'invalid-params');
			expect(res.body).to.have.property('error').include("must have required property 'roomId'");
		});

		it('should delete a room when the request is correct', async () => {
			const res = await request
				.post(api('rooms.delete'))
				.set(credentials)
				.send({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});
		it('should throw an error when the room id doesn exist', async () => {
			const res = await request
				.post(api('rooms.delete'))
				.set(credentials)
				.send({ roomId: 'invalid' })
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
		});
		it('should throw an error when room is a main team room', async () => {
			const res = await request
				.post(api('rooms.delete'))
				.set(credentials)
				.send({ roomId: testTeam.roomId })
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
		});
	});

	describe('rooms.saveRoomSettings', () => {
		let testChannel: IRoom;
		const randomString = `randomString${Date.now()}`;
		const teamName = `team-${Date.now()}`;
		let discussion: IRoom;
		let testTeam: ITeam;

		before(async () => {
			const result = await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;

			const resTeam = await request.post(api('teams.create')).set(credentials).send({ name: teamName, type: 0 });
			const resDiscussion = await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
				});

			testTeam = resTeam.body.team;
			discussion = resDiscussion.body.discussion;
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'p', roomId: discussion._id }),
				deleteTeam(credentials, testTeam.name),
				deleteRoom({ type: 'p', roomId: testChannel._id }),
			]),
		);

		it('should update the room settings', (done) => {
			const imageDataUri = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), imgURL)).toString('base64')}`;

			void request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					roomAvatar: imageDataUri,
					featured: true,
					roomName: randomString,
					roomTopic: randomString,
					roomAnnouncement: randomString,
					roomDescription: randomString,
					roomType: 'p',
					readOnly: true,
					reactWhenReadOnly: true,
					default: true,
					favorite: {
						favorite: true,
						defaultValue: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end(done);
		});

		it('should have reflected on rooms.info', async () => {
			const res = await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('room').and.to.be.an('object');

			expect(res.body.room).to.have.property('_id', testChannel._id);
			expect(res.body.room).to.have.property('name', randomString);
			expect(res.body.room).to.have.property('topic', randomString);
			expect(res.body.room).to.have.property('announcement', randomString);
			expect(res.body.room).to.have.property('description', randomString);
			expect(res.body.room).to.have.property('t', 'p');
			expect(res.body.room).to.have.property('featured', true);
			expect(res.body.room).to.have.property('ro', true);
			expect(res.body.room).to.have.property('default', true);
			expect(res.body.room).to.have.property('favorite', true);
			expect(res.body.room).to.have.property('reactWhenReadOnly', true);
		});

		it('should be able to update the discussion name with spaces', async () => {
			const newDiscussionName = `${randomString} with spaces`;

			await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({
					rid: discussion._id,
					roomName: newDiscussionName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: discussion._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');

					expect(res.body.room).to.have.property('_id', discussion._id);
					expect(res.body.room).to.have.property('fname', newDiscussionName);
				});
		});

		it('should mark a room as favorite', async () => {
			await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					favorite: {
						favorite: true,
						defaultValue: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');

					expect(res.body.room).to.have.property('_id', testChannel._id);
					expect(res.body.room).to.have.property('favorite', true);
				});
		});
		it('should not mark a room as favorite when room is not a default room', async () => {
			await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					favorite: {
						favorite: true,
						defaultValue: false,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			await request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');

					expect(res.body.room).to.have.property('_id', testChannel._id);
					expect(res.body.room).to.not.have.property('favorite');
				});
		});
	});

	describe('rooms.images', () => {
		let testUserCreds: Credentials;
		before(async () => {
			const user = await createUser();
			testUserCreds = await login(user.username, password);
		});

		const uploadFile = async ({ roomId, file }: { roomId: IRoom['_id']; file: Buffer | fs.ReadStream | string | boolean | number }) => {
			let fileId;
			await request
				.post(api(`rooms.media/${roomId}`))
				.set(credentials)
				.attach('file', file)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('file');
					expect(res.body.file).to.have.property('_id');
					fileId = res.body.file._id;
				});

			const res = await request
				.post(api(`rooms.mediaConfirm/${roomId}/${fileId}`))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			return res.body.message.attachments[0];
		};

		const getIdFromImgPath = (link: string) => {
			return link.split('/')[2];
		};

		it('should return an error when user is not logged in', async () => {
			await request.get(api('rooms.images')).expect(401);
		});
		it('should return an error when the required parameter "roomId" is not provided', async () => {
			await request.get(api('rooms.images')).set(credentials).expect(400);
		});
		it('should return an error when the required parameter "roomId" is not a valid room', async () => {
			await request.get(api('rooms.images')).set(credentials).query({ roomId: 'invalid' }).expect(403);
		});
		it('should return an error when room is valid but user is not part of it', async () => {
			const { body } = await createRoom({ type: 'p', name: `test-${Date.now()}` });

			const {
				group: { _id: roomId },
			} = body;
			await request.get(api('rooms.images')).set(testUserCreds).query({ roomId }).expect(403);

			await deleteRoom({ type: 'p', roomId });
		});
		it('should return an empty array when room is valid and user is part of it but there are no images', async () => {
			const { body } = await createRoom({ type: 'p', name: `test-${Date.now()}` });
			const {
				group: { _id: roomId },
			} = body;
			await request
				.get(api('rooms.images'))
				.set(credentials)
				.query({ roomId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array').and.to.have.lengthOf(0);
				});

			await deleteRoom({ type: 'p', roomId });
		});
		it('should return an array of images when room is valid and user is part of it and there are images', async () => {
			const { body } = await createRoom({ type: 'p', name: `test-${Date.now()}` });
			const {
				group: { _id: roomId },
			} = body;
			const { title_link } = await uploadFile({
				roomId,
				file: fs.createReadStream(path.join(process.cwd(), imgURL)),
			});
			const fileId = getIdFromImgPath(title_link);
			await request
				.get(api('rooms.images'))
				.set(credentials)
				.query({ roomId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body.files[0]).to.have.property('_id', fileId);
				});

			await deleteRoom({ type: 'p', roomId });
		});
		it('should return multiple images when room is valid and user is part of it and there are multiple images', async () => {
			const { body } = await createRoom({ type: 'p', name: `test-${Date.now()}` });
			const {
				group: { _id: roomId },
			} = body;
			const { title_link: link1 } = await uploadFile({
				roomId,
				file: fs.createReadStream(path.join(process.cwd(), imgURL)),
			});
			const { title_link: link2 } = await uploadFile({
				roomId,
				file: fs.createReadStream(path.join(process.cwd(), imgURL)),
			});

			const fileId1 = getIdFromImgPath(link1);
			const fileId2 = getIdFromImgPath(link2);

			await request
				.get(api('rooms.images'))
				.set(credentials)
				.query({ roomId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array').and.to.have.lengthOf(2);
					expect((res.body.files as IUpload[]).find((file) => file._id === fileId1)).to.exist;
					expect((res.body.files as IUpload[]).find((file) => file._id === fileId2)).to.exist;
				});

			await deleteRoom({ type: 'p', roomId });
		});
		it('should allow to filter images passing the startingFromId parameter', async () => {
			const { body } = await createRoom({ type: 'p', name: `test-${Date.now()}` });
			const {
				group: { _id: roomId },
			} = body;
			const { title_link } = await uploadFile({
				roomId,
				file: fs.createReadStream(path.join(process.cwd(), imgURL)),
			});
			await uploadFile({
				roomId,
				file: fs.createReadStream(path.join(process.cwd(), imgURL)),
			});

			const fileId2 = getIdFromImgPath(title_link);
			await request
				.get(api('rooms.images'))
				.set(credentials)
				.query({ roomId, startingFromId: fileId2 })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body.files[0]).to.have.property('_id', fileId2);
				});

			await deleteRoom({ type: 'p', roomId });
		});
	});

	describe('/rooms.muteUser', () => {
		let testChannel: IRoom;

		before('create a channel', async () => {
			const result = await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should invite rocket.cat user to room', () => {
			return request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel.name', testChannel.name);
				});
		});

		it('should mute the rocket.cat user', () => {
			return request
				.post(api('rooms.muteUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should contain rocket.cat user in mute list', () => {
			return request
				.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel.name', testChannel.name);
					expect(res.body.channel).to.have.property('muted').and.to.be.an('array');
					expect(res.body.channel.muted).to.have.lengthOf(1);
					expect(res.body.channel.muted[0]).to.be.equal('rocket.cat');
				});
		});
	});

	describe('/rooms.unmuteUser', () => {
		let testChannel: IRoom;

		before('create a channel', async () => {
			const result = await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;

			await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					readOnly: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel.name', testChannel.name);
				});
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should unmute the rocket.cat user in read-only room', () => {
			return request
				.post(api('rooms.unmuteUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should contain rocket.cat user in unmute list', () => {
			return request
				.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel.name', testChannel.name);
					expect(res.body.channel).to.have.property('unmuted').and.to.be.an('array');
					expect(res.body.channel.unmuted).to.have.lengthOf(1);
					expect(res.body.channel.unmuted[0]).to.be.equal('rocket.cat');
				});
		});
	});

	describe('/rooms.export', () => {
		let testChannel: IRoom;
		let testMessageId: IMessage['_id'];

		before(async () => {
			const result = await createRoom({ type: 'c', name: `channel.export.test.${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;
			const { body: { message } = {} } = await sendSimpleMessage({
				roomId: testChannel._id,
				text: 'Message to create thread',
			});
			testMessageId = message._id;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should fail exporting room as file if dates are incorrectly provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'file',
					dateFrom: 'test-date',
					dateTo: 'test-date',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail exporting room as file if no roomId is provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					type: 'file',
					dateFrom: '2024-03-15',
					dateTo: '2024-03-22',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').include("must have required property 'rid'");
				});
		});

		it('should fail exporting room as file if no type is provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					dateFrom: '2024-03-15',
					dateTo: '2024-03-22',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').include("must have required property 'type'");
				});
		});

		it('should fail exporting room as file if fromDate is after toDate (incorrect date interval)', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'file',
					dateFrom: '2024-03-22',
					dateTo: '2024-03-15',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-dates');
					expect(res.body).to.have.property('error', 'From date cannot be after To date [error-invalid-dates]');
				});
		});

		it('should fail exporting room as file if invalid roomId is provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: 'invalid-rid',
					type: 'file',
					dateFrom: '2024-03-22',
					dateTo: '2024-03-15',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-room');
				});
		});

		it('should fail exporting room as file if no format is provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'file',
					dateFrom: '2024-03-15',
					dateTo: '2024-03-22',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail exporting room as file if an invalid format is provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'file',
					dateFrom: '2024-03-15',
					dateTo: '2024-03-22',
					format: 'invalid-format',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail exporting room as file if an invalid type is provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'invalid-type',
					dateFrom: '2024-03-15',
					dateTo: '2024-03-22',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should succesfully export room as file', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'file',
					dateFrom: '2024-03-15',
					dateTo: '2024-03-22',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should succesfully export room as file even if no dates are provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'file',
					format: 'html',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail exporting room via email if target users AND target emails are NOT provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'email',
					toUsers: [],
					subject: 'Test Subject',
					messages: [testMessageId],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-recipient');
				});
		});

		it('should fail exporting room via email if no target e-mails are provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'email',
					toEmails: [],
					subject: 'Test Subject',
					messages: [testMessageId],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-recipient');
				});
		});

		it('should fail exporting room via email if no target users or e-mails params are provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'email',
					subject: 'Test Subject',
					messages: [testMessageId],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-recipient');
				});
		});

		it('should fail exporting room via email if no messages are provided', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'email',
					toUsers: [credentials['X-User-Id']],
					subject: 'Test Subject',
					messages: [],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should succesfully export room via email', async () => {
			return request
				.post(api('rooms.export'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					type: 'email',
					toUsers: [credentials['X-User-Id']],
					subject: 'Test Subject',
					messages: [testMessageId],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('missing');
					expect(res.body.missing).to.be.an('array').that.is.empty;
				});
		});
	});

	describe('/rooms.isMember', () => {
		let testChannel: IRoom;
		let testGroup: IRoom;
		let testDM: IRoom;

		const fakeRoomId = `room.test.${Date.now()}-${Math.random()}`;
		const fakeUserId = `user.test.${Date.now()}-${Math.random()}`;

		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		const testGroupName = `group.test.${Date.now()}-${Math.random()}`;

		let testUser1: TestUser<IUser>;
		let testUser2: TestUser<IUser>;
		let testUserNonMember: TestUser<IUser>;
		let testUser1Credentials: Credentials;
		let testUserNonMemberCredentials: Credentials;

		before(async () => {
			testUser1 = await createUser();
			testUser1Credentials = await login(testUser1.username, password);
		});

		before(async () => {
			testUser2 = await createUser();
		});

		before(async () => {
			testUserNonMember = await createUser();
			testUserNonMemberCredentials = await login(testUserNonMember.username, password);
		});

		before(async () => {
			const response = await createRoom({
				type: 'c',
				name: testChannelName,
				members: [testUser1.username, testUser2.username],
			});
			testChannel = response.body.channel;
		});

		before(async () => {
			const response = await createRoom({
				type: 'p',
				name: testGroupName,
				members: [testUser1.username, testUser2.username],
			});
			testGroup = response.body.group;
		});

		before(async () => {
			const response = await createRoom({
				type: 'd',
				username: testUser2.username,
				credentials: testUser1Credentials,
			});
			testDM = response.body.room;
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				deleteRoom({ type: 'p', roomId: testGroup._id }),
				deleteRoom({ type: 'd', roomId: testDM._id }),
				deleteUser(testUser1),
				deleteUser(testUser2),
				deleteUser(testUserNonMember),
			]),
		);

		it('should return error if room not found', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: fakeRoomId,
					userId: testUser1._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property(
						'error',
						'The required "roomId" or "roomName" param provided does not match any channel [error-room-not-found]',
					);
				});
		});

		it('should return error if user not found with the given userId', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testChannel._id,
					userId: fakeUserId,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-user-not-found');
				});
		});

		it('should return error if user not found with the given username', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testChannel._id,
					username: fakeUserId,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-user-not-found');
				});
		});

		it('should return success with isMember=true if given userId is a member of the channel', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testChannel._id,
					userId: testUser2._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', true);
				});
		});

		it('should return success with isMember=true if given username is a member of the channel', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testChannel._id,
					username: testUser2.username,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', true);
				});
		});

		it('should return success with isMember=false if user is not a member of the channel', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testChannel._id,
					userId: testUserNonMember._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', false);
				});
		});

		it('should return success with isMember=true if given userId is a member of the group', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testGroup._id,
					userId: testUser2._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', true);
				});
		});

		it('should return success with isMember=true if given username is a member of the group', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testGroup._id,
					username: testUser2.username,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', true);
				});
		});

		it('should return success with isMember=false if user is not a member of the group', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testGroup._id,
					userId: testUserNonMember._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', false);
				});
		});

		it('should return unauthorized if caller cannot access the group', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUserNonMemberCredentials)
				.query({
					roomId: testGroup._id,
					userId: testUser1._id,
				})
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				});
		});

		it('should return success with isMember=true if given userId is a member of the DM', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testDM._id,
					userId: testUser2._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', true);
				});
		});

		it('should return success with isMember=true if given username is a member of the DM', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testDM._id,
					username: testUser2.username,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', true);
				});
		});

		it('should return success with isMember=false if user is not a member of the DM', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUser1Credentials)
				.query({
					roomId: testDM._id,
					userId: testUserNonMember._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('isMember', false);
				});
		});

		it('should return unauthorized if caller cannot access the DM', () => {
			return request
				.get(api('rooms.isMember'))
				.set(testUserNonMemberCredentials)
				.query({
					roomId: testDM._id,
					userId: testUser1._id,
				})
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				});
		});
	});

	describe('/rooms.open', () => {
		let room: IRoom;

		before(async () => {
			room = (await createRoom({ type: 'c', name: `rooms.open.test.${Date.now()}` })).body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: room._id });
		});

		it('should open the room', (done) => {
			void request
				.post(api('rooms.open'))
				.set(credentials)
				.send({ roomId: room._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			void request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: room._id })
				.send()
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('open', true);
				})
				.end(done);
		});

		it('should fail if roomId is not provided', async () => {
			await request
				.post(api('rooms.open'))
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
	});

	describe('[/rooms.membersOrderedByRole]', () => {
		const isEnterprise = Boolean(process.env.IS_EE);

		let testChannel: IRoom;
		let ownerUser: IUser;
		let leaderUser: IUser;
		let moderatorUser: IUser;
		let memberUser1: IUser;
		let memberUser2: IUser;
		let customRole: IRole;

		let ownerCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		let memberUser1Credentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		let memberUser2Credentials: { 'X-Auth-Token': string; 'X-User-Id': string };

		before(async () => {
			[ownerUser, leaderUser, moderatorUser, memberUser1, memberUser2] = await Promise.all([
				createUser({ username: `a_${Random.id()}`, roles: ['admin'] }),
				createUser({ username: `b_${Random.id()}` }),
				createUser({ username: `c_${Random.id()}` }),
				createUser({ username: `d_${Random.id()}` }),
				createUser({ username: `e_${Random.id()}` }),
			]);

			[ownerCredentials, memberUser1Credentials, memberUser2Credentials] = await Promise.all([
				login(ownerUser.username, password),
				login(memberUser1.username, password),
				login(memberUser2.username, password),
			]);

			customRole = await createCustomRole({
				name: `customRole.${Random.id()}`,
				scope: 'Subscriptions',
				description: 'Custom Role',
			});

			// Create a public channel
			const roomCreationResponse = await createRoom({
				type: 'c',
				name: `rooms.membersOrderedByRole.test.${Date.now()}`,
				credentials: ownerCredentials,
			});
			testChannel = roomCreationResponse.body.channel;

			await Promise.all(
				[leaderUser._id, moderatorUser._id, memberUser1._id, memberUser2._id].map((userId) =>
					request
						.post(api('channels.invite'))
						.set(ownerCredentials)
						.send({
							roomId: testChannel._id,
							userId,
						})
						.expect(200),
				),
			);

			await Promise.all([
				request
					.post(api('channels.addLeader'))
					.set(ownerCredentials)
					.send({
						roomId: testChannel._id,
						userId: leaderUser._id,
					})
					.expect(200),
				request
					.post(api('channels.addModerator'))
					.set(ownerCredentials)
					.send({
						roomId: testChannel._id,
						userId: moderatorUser._id,
					})
					.expect(200),
			]);
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
			await Promise.all([ownerUser, moderatorUser, memberUser1, memberUser2].map((user) => deleteUser(user)));
			if (isEnterprise && customRole) {
				await deleteCustomRole({ roleId: customRole._id });
			}
		});

		it('should return a list of members ordered by owner, leader, moderator, then members by default', async () => {
			const response = await request
				.get(api('rooms.membersOrderedByRole'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.members).to.be.an('array');

			const [first, second, third, ...rest] = response.body.members;
			expect(first.username).to.equal(ownerUser.username);
			expect(second.username).to.equal(leaderUser.username);
			expect(third.username).to.equal(moderatorUser.username);

			const memberUsernames = rest.map((m: any) => m.username);
			expect(memberUsernames).to.include(memberUser1.username);
			expect(memberUsernames).to.include(memberUser2.username);

			expect(response.body).to.have.property('total');
			expect(response.body.total).to.be.eq(5);
		});

		it('should support sorting by role in descending priority', async () => {
			const response = await request
				.get(api('rooms.membersOrderedByRole'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					sort: '{"rolePriority":-1}',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			const [first, second, third, fourth, fifth] = response.body.members;

			expect(first.username).to.equal(memberUser1.username);
			expect(second.username).to.equal(memberUser2.username);
			expect(third.username).to.equal(moderatorUser.username);
			expect(fourth.username).to.equal(leaderUser.username);
			expect(fifth.username).to.equal(ownerUser.username);
		});

		it('should support pagination', async () => {
			const response = await request
				.get(api('rooms.membersOrderedByRole'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					count: 2,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.members).to.have.lengthOf(2);
			expect(response.body.total).to.be.eq(5);
		});

		it('should return matched members when using filter param', async () => {
			const response = await request
				.get(api(`rooms.membersOrderedByRole`))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: memberUser1.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.members).to.have.lengthOf(1);
			expect(response.body.members[0]).have.property('username', memberUser1.username);
		});

		it('should return empty list if no matches (e.g., filter by status that no one has)', async () => {
			const response = await request
				.get(api(`rooms.membersOrderedByRole`))
				.set(credentials)
				.query({
					'roomId': testChannel._id,
					'status[]': 'SomeRandomStatus',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.members).to.be.an.empty('array');
		});

		it('should support custom sorting by username descending', async () => {
			const response = await request
				.get(api('rooms.membersOrderedByRole'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					sort: JSON.stringify({ username: -1 }),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			const usernames = response.body.members.map((m: any) => m.username);

			const expected = [
				ownerUser.username, // since owner
				leaderUser.username, // since leader
				moderatorUser.username, // since moderator
				memberUser2.username,
				memberUser1.username,
			];

			expect(usernames).to.deep.equal(expected);
		});

		it('should not be affected by custom roles when sorting', async () => {
			if (!isEnterprise) {
				return;
			}
			await Promise.all([
				assignRoleToUser({ username: moderatorUser.username as string, roleId: customRole._id }),
				assignRoleToUser({ username: memberUser2.username as string, roleId: customRole._id }),
			]);

			const response = await request
				.get(api('rooms.membersOrderedByRole'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			const [first, second, third, fourth, fifth] = response.body.members;

			expect(first.username).to.equal(ownerUser.username);
			expect(second.username).to.equal(leaderUser.username);
			expect(third.username).to.equal(moderatorUser.username);
			expect(fourth.username).to.equal(memberUser1.username);
			expect(fifth.username).to.equal(memberUser2.username);
		});

		describe('Sort by user status', () => {
			before(async () => {
				await request.post(api('settings/Accounts_AllowUserStatusMessageChange')).set(credentials).send({ value: true }).expect(200);

				await Promise.all([
					request.post(api('users.setStatus')).set(memberUser1Credentials).send({ status: 'offline', userId: memberUser1._id }).expect(200),
					request.post(api('users.setStatus')).set(memberUser2Credentials).send({ status: 'online', userId: memberUser2._id }).expect(200),
				]);
			});

			// Skipping resetting setting Accounts_AllowUserStatusMessageChange as default value is true
			after(() =>
				request.post(api('users.setStatus')).set(memberUser2Credentials).send({ status: 'offline', userId: memberUser2._id }).expect(200),
			);

			it('should sort by user status after user role', async () => {
				const response = await request
					.get(api('rooms.membersOrderedByRole'))
					.set(credentials)
					.query({
						roomId: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body).to.have.property('success', true);
				const [first, second, third, fourth, fifth] = response.body.members;

				expect(first.username).to.equal(ownerUser.username); // since owner
				expect(second.username).to.equal(leaderUser.username); // since leader
				expect(third.username).to.equal(moderatorUser.username); // since moderator
				expect(fourth.username).to.equal(memberUser2.username); // since online
				expect(fifth.username).to.equal(memberUser1.username); // since offline
			});
		});

		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateChannel: IRoom;
			let publicChannel: IRoom;
			let publicTeam: ITeam;
			let privateTeam: ITeam;
			let privateChannelInPublicTeam: IRoom;
			let publicChannelInPublicTeam: IRoom;
			let privateChannelInPrivateTeam: IRoom;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a public team and a private team
				[publicTeam, privateTeam] = await Promise.all([
					createTeam(insideCredentials, `rooms.membersOrderedByRole.team.public.${Random.id()}`, TeamType.PUBLIC, [
						outsiderUser.username as string,
					]),
					createTeam(insideCredentials, `rooms.membersOrderedByRole.team.private.${Random.id()}`, TeamType.PRIVATE, [
						outsiderUser.username as string,
					]),
				]);

				const [
					privateInPublicResponse,
					publicInPublicResponse,
					privateInPrivateResponse,
					publicInPrivateResponse,
					privateRoomResponse,
					publicRoomResponse,
				] = await Promise.all([
					createRoom({
						type: 'p',
						name: `teamPublic.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPublic.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `teamPrivate.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPrivate.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `rooms.membersOrderedByRole.private.${Date.now()}`,
						credentials: insideCredentials,
					}),
					createRoom({
						type: 'c',
						name: `rooms.membersOrderedByRole.public.${Date.now()}`,
						credentials: insideCredentials,
					}),
				]);

				privateChannelInPublicTeam = privateInPublicResponse.body.group;
				publicChannelInPublicTeam = publicInPublicResponse.body.channel;
				privateChannelInPrivateTeam = privateInPrivateResponse.body.group;
				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;
				privateChannel = privateRoomResponse.body.group;
				publicChannel = publicRoomResponse.body.channel;
			});

			after(async () => {
				await Promise.all([
					deleteRoom({ type: 'p', roomId: privateChannel._id }),
					deleteRoom({ type: 'c', roomId: publicChannel._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPublicTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPublicTeam._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPrivateTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id }),
				]);

				await Promise.all([
					deleteTeam(credentials, publicTeam.name),
					deleteTeam(credentials, privateTeam.name),
					restorePermissionToRoles('view-c-room'),
				]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);
			});

			it('should not fetch private room members by user not part of room', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch private room members by user who is part of the room', async () => {
				const response = await request
					.get(api('rooms.membersOrderedByRole'))
					.set(insideCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.members).to.be.an('array');
			});

			it('should fetch public room members by user who is part of the room', async () => {
				const response = await request
					.get(api('rooms.membersOrderedByRole'))
					.set(insideCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.members).to.be.an('array');
			});

			it('should fetch public room members by user not part of room - because public', async () => {
				await updatePermission('view-c-room', ['admin', 'user', 'guest']);
				const response = await request
					.get(api('rooms.membersOrderedByRole'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.members).to.be.an('array');
			});

			it('should fetch a private channel members inside a public team by someone part of the room ', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should not fetch a private channel members inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a public channel members inside a public team by someone part of the room ', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a private team by someone part of the room', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should not fetch a public channel members inside a private team by someone not part of team', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a private channel members inside a private team by someone part of the room', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should not fetch a private channel members inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a private team by someone not part of team', async () => {
				await request
					.get(api('rooms.membersOrderedByRole'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});

	describe('/rooms.hide', () => {
		let roomA: IRoom;
		let roomB: IRoom;
		const roomName = `rooms.hide.test.${Date.now()}`;
		let memberA: TestUser<IUser>;
		let memberB: TestUser<IUser>;
		let nonMember: TestUser<IUser>;
		let nonMemberCredentials: Credentials;

		before(async () => {
			memberA = await createUser();
			memberB = await createUser();
			nonMember = await createUser();
			nonMemberCredentials = await login(nonMember.username, password);
		});

		before(async () => {
			roomA = (await createRoom({ type: 'c', name: roomName, members: [memberA.username, memberB.username] })).body.channel;
			roomB = (await createRoom({ type: 'd', username: memberB.username })).body.room;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: roomA._id });
			await deleteRoom({ type: 'd', roomId: roomB._id });
			await deleteUser(memberA);
			await deleteUser(memberB);
			await deleteUser(nonMember);
		});

		it('should hide the room', async () => {
			await request
				.post(api('rooms.hide'))
				.set(credentials)
				.send({ roomId: roomA._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should be already hidden', async () => {
			await request
				.post(api('rooms.hide'))
				.set(credentials)
				.send({ roomId: roomA._id })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', `error-room-already-hidden`);
				});
		});

		it('should fail if roomId is not provided', async () => {
			await request
				.post(api('rooms.hide'))
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should return 401 if user is not logged in', async () => {
			await request
				.post(api('rooms.hide'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should return forbidden if user does not have access to the room', async () => {
			await request
				.post(api('rooms.hide'))
				.set(nonMemberCredentials)
				.send({ roomId: roomB._id })
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});
	});

	describe('/rooms.roles', () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` })).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should get room roles', async () => {
			const response = await request.get(api('rooms.roles')).set(credentials).query({ rid: testChannel._id }).expect(200);
			expect(response.body.success).to.be.true;
			// the schema is already validated in the server on TEST mode
			expect(response.body.roles).to.be.an('array');
			// it should have the user roles
			expect(response.body.roles).to.have.lengthOf(1);
			expect(response.body.roles[0].rid).to.equal(testChannel._id);
			expect(response.body.roles[0].roles).to.be.an('array');
			// it should contain owner role
			expect(response.body.roles[0].roles).to.include('owner');
		});
	});

	describe('/rooms.banUser', () => {
		let testChannel: IRoom;
		let bannableUser: TestUser<IUser>;
		let bannableUserCredentials: Credentials;

		before(async () => {
			bannableUser = await createUser();
			bannableUserCredentials = await login(bannableUser.username, password);

			const result = await createRoom({ type: 'c', name: `ban-test-${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;

			// Invite the user to the channel
			await request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect(200);
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
			await deleteUser(bannableUser);
		});

		it('should fail if not authenticated', () => {
			return request
				.post(api('rooms.banUser'))
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(401);
		});

		it('should fail if roomId is missing', () => {
			return request
				.post(api('rooms.banUser'))
				.set(credentials)
				.send({
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail if userId and username are both missing', () => {
			return request
				.post(api('rooms.banUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should ban a user from the room', () => {
			return request
				.post(api('rooms.banUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail if user is already banned', () => {
			return request
				.post(api('rooms.banUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should prevent banned user from sending messages', () => {
			return request
				.post(api('chat.sendMessage'))
				.set(bannableUserCredentials)
				.send({
					message: {
						rid: testChannel._id,
						msg: 'This should fail',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should not list the banned user in channel members', () => {
			return request
				.get(api('channels.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const usernames = res.body.members.map((m: IUser) => m.username);
					expect(usernames).to.not.include(bannableUser.username);
				});
		});

		describe('unban via re-invite', () => {
			it('should fail to invite a banned user', () => {
				return request
					.post(api('channels.invite'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						userId: bannableUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-user-is-banned');
					});
			});

			it('should list the banned user in rooms.bannedUsers', async () => {
				const res = await request
					.get(api('rooms.bannedUsers'))
					.set(credentials)
					.query({
						roomId: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(res.body).to.have.property('success', true);
				const usernames = res.body.bannedUsers.map((u: { username: string }) => u.username);
				expect(usernames).to.include(bannableUser.username);
			});

			it('should unban the user and then re-invite successfully', async () => {
				await request
					.post(api('rooms.unbanUser'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						username: bannableUser.username,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				await request
					.post(api('channels.invite'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						userId: bannableUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});

			// Non Federated room should replace the status from BANNED to member since invite is not in place yet
			it('should set the re-invited user subscription to INVITED status', async () => {
				const res = await request
					.get(api('subscriptions.getOne'))
					.set(bannableUserCredentials)
					.query({
						roomId: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(res.body).to.have.property('success', true);
				expect(res.body.subscription).not.to.have.property('status');
			});

			it('should list the re-invited user in channel members', () => {
				return request
					.get(api('channels.members'))
					.set(credentials)
					.query({
						roomId: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						const usernames = res.body.members.map((m: IUser) => m.username);
						expect(usernames).to.include(bannableUser.username);
					});
			});

			it('should no longer list the user as banned', () => {
				return request
					.get(api('rooms.bannedUsers'))
					.set(credentials)
					.query({
						roomId: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						const userIds = res.body.bannedUsers.map((u: IUser) => u._id);
						expect(userIds).to.not.include(bannableUser._id);
					});
			});
		});
	});

	describe('/rooms.unbanUser', () => {
		let testChannel: IRoom;
		let bannableUser: TestUser<IUser>;

		before(async () => {
			bannableUser = await createUser();
			await login(bannableUser.username, password);

			const result = await createRoom({ type: 'c', name: `unban-test-${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;

			// Invite the user to the channel
			await request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect(200);

			// Ban the user
			await request
				.post(api('rooms.banUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect(200);
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
			await deleteUser(bannableUser);
		});

		it('should fail if not authenticated', () => {
			return request
				.post(api('rooms.unbanUser'))
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(401);
		});

		it('should unban a user from the room', () => {
			return request
				.post(api('rooms.unbanUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should NOT list the unbanned user in channel members', () => {
			return request
				.get(api('channels.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const usernames = res.body.members.map((m: IUser) => m.username);
					expect(usernames).to.not.include(bannableUser.username);
				});
		});

		it('should NOT list the user as banned after unban', () => {
			return request
				.get(api('rooms.bannedUsers'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const userIds = res.body.bannedUsers.map((u: IUser) => u._id);
					expect(userIds).to.not.include(bannableUser._id);
				});
		});

		it('should allow re-inviting the unbanned user as a fresh invite', async () => {
			await request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			// Verify the user is now listed in channel members
			await request
				.get(api('channels.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const usernames = res.body.members.map((m: IUser) => m.username);
					expect(usernames).to.include(bannableUser.username);
				});
		});

		it('should fail to unban a user that is not banned', () => {
			return request
				.post(api('rooms.unbanUser'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: bannableUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-user-not-banned');
				});
		});
	});

	describe('/rooms.bannedUsers', () => {
		let testChannel: IRoom;
		let bannedUsers: TestUser<IUser>[];
		let bannedUserIds: string[];

		before(async () => {
			const result = await createRoom({ type: 'c', name: `banned-users-list-${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;

			bannedUsers = await Promise.all([createUser(), createUser(), createUser()]);
			bannedUserIds = bannedUsers.map((user) => user._id);

			for (const user of bannedUsers) {
				await request
					.post(api('channels.invite'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						userId: user._id,
					})
					.expect(200);

				await request
					.post(api('rooms.banUser'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						userId: user._id,
					})
					.expect(200);
			}
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
			await Promise.all(bannedUsers.map((user) => deleteUser(user)));
		});

		it('should list every banned user of the room with only the projected fields', async () => {
			const res = await request
				.get(api('rooms.bannedUsers'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('total', bannedUsers.length);
			expect(res.body).to.have.property('count', bannedUsers.length);
			expect(res.body).to.have.property('offset', 0);
			expect(res.body.bannedUsers).to.be.an('array').with.lengthOf(bannedUsers.length);
			expect(res.body.bannedUsers.map((u: IUser) => u._id)).to.have.members(bannedUserIds);

			res.body.bannedUsers.forEach((user: IUser) => {
				expect(user).to.have.property('_id').that.is.a('string');
				expect(user).to.have.property('username').that.is.a('string');
				expect(Object.keys(user)).to.satisfy(
					(keys: string[]) => keys.every((key) => ['_id', 'username', 'name'].includes(key)),
					'response should only contain the projected fields (_id, username, name)',
				);
			});
		});

		it('should limit the number of banned users returned when count is provided', async () => {
			const res = await request
				.get(api('rooms.bannedUsers'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					count: 2,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('total', bannedUsers.length);
			expect(res.body).to.have.property('count', 2);
			expect(res.body).to.have.property('offset', 0);
			expect(res.body.bannedUsers).to.be.an('array').with.lengthOf(2);
		});

		it('should skip banned users when offset is provided', async () => {
			const res = await request
				.get(api('rooms.bannedUsers'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					offset: 2,
					count: 2,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('total', bannedUsers.length);
			expect(res.body).to.have.property('offset', 2);
			expect(res.body.bannedUsers)
				.to.be.an('array')
				.with.lengthOf(bannedUsers.length - 2);
		});

		it('should paginate through all banned users without overlapping results', async () => {
			const firstPage = await request
				.get(api('rooms.bannedUsers'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					count: 2,
				})
				.expect(200);

			const secondPage = await request
				.get(api('rooms.bannedUsers'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					offset: 2,
					count: 2,
				})
				.expect(200);

			const firstPageIds = firstPage.body.bannedUsers.map((u: IUser) => u._id);
			const secondPageIds = secondPage.body.bannedUsers.map((u: IUser) => u._id);

			expect(firstPageIds.filter((id: string) => secondPageIds.includes(id))).to.be.empty;
			expect([...firstPageIds, ...secondPageIds]).to.have.members(bannedUserIds);
		});
	});
});

describe('[/rooms.history]', () => {
	let testChannel: IRoom;
	const messageIds: IMessage['_id'][] = [];
	const messageCount = 12;

	before((done) => getCredentials(done));

	before(async () => {
		testChannel = (await createRoom({ type: 'c', name: `rooms-history-${Date.now()}` })).body.channel;

		for (let i = 0; i < messageCount; i++) {
			const res = await sendMessage({ message: { rid: testChannel._id, msg: `message-${i}` } });
			messageIds.push(res.body.message._id);
		}
	});

	after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

	it('should return the newest page with no forward cursor', async () => {
		const res = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, count: 5 })
			.expect('Content-Type', 'application/json')
			.expect(200);

		expect(res.body).to.have.property('success', true);
		expect(res.body.messages).to.have.lengthOf(5);
		expect(res.body.cursor).to.have.property('next', null);
		expect(res.body.cursor.previous).to.be.a('string');

		expect(res.body.messages[0]._id).to.equal(messageIds[messageCount - 1]);
		expect(res.body.messages[0].msg).to.equal(`message-${messageCount - 1}`);
	});

	it('should page backwards through `previous` without repeating messages', async () => {
		const firstPage = await request.get(api('rooms.history')).set(credentials).query({ roomId: testChannel._id, count: 5 }).expect(200);

		const secondPage = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, count: 5, previous: firstPage.body.cursor.previous })
			.expect(200);

		const firstIds = firstPage.body.messages.map((m: IMessage) => m._id);
		const secondIds = secondPage.body.messages.map((m: IMessage) => m._id);

		expect(secondIds).to.have.lengthOf(5);
		expect(firstIds.filter((id: string) => secondIds.includes(id))).to.be.empty;
		expect(secondPage.body.cursor.next).to.be.a('string');
	});

	it('should page forwards through `next` and still return newest-first', async () => {
		const firstPage = await request.get(api('rooms.history')).set(credentials).query({ roomId: testChannel._id, count: 5 }).expect(200);

		const older = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, count: 5, previous: firstPage.body.cursor.previous })
			.expect(200);

		const forwards = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, count: 5, next: older.body.cursor.next })
			.expect(200);

		const timestamps = forwards.body.messages.map((m: IMessage) => new Date(m.ts).getTime());
		expect(timestamps).to.deep.equal([...timestamps].sort((a, b) => b - a));

		expect(forwards.body.messages.map((m: IMessage) => m._id)).to.have.members(firstPage.body.messages.map((m: IMessage) => m._id));
	});

	it('should exhaust the room and close the backward cursor', async () => {
		let cursor: string | null = null;
		const seen = new Set<string>();

		for (let page = 0; page < 10; page++) {
			const res: Awaited<ReturnType<typeof request.get>> = await request
				.get(api('rooms.history'))
				.set(credentials)
				.query({ roomId: testChannel._id, count: 5, ...(cursor && { previous: cursor }) })
				.expect(200);

			res.body.messages.forEach((m: IMessage) => seen.add(m._id));
			cursor = res.body.cursor.previous;

			if (cursor === null) {
				break;
			}
		}

		expect(cursor).to.be.null;
		messageIds.forEach((id) => expect(seen.has(id)).to.be.true);
	});

	it('should report unreads from `lastSeen` without truncating the page', async () => {
		const all = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, count: messageCount })
			.expect(200);

		const marker = all.body.messages[Math.floor(messageCount / 2)];

		const res = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, count: 5, lastSeen: new Date(marker.ts).toISOString() })
			.expect(200);

		// `lastSeen` must not bound the page the way `oldest` does
		expect(res.body.messages).to.have.lengthOf(5);
		expect(res.body).to.have.property('unreadNotLoaded');
		expect(res.body.unreadNotLoaded).to.be.a('number');
	});

	it('should serve private groups and DMs through the same endpoint', async () => {
		const { group } = (await createRoom({ type: 'p', name: `rooms-history-group-${Date.now()}` })).body;
		await sendMessage({ message: { rid: group._id, msg: 'group message' } });

		const groupRes = await request.get(api('rooms.history')).set(credentials).query({ roomId: group._id }).expect(200);

		expect(groupRes.body).to.have.property('success', true);
		expect(groupRes.body.messages[0].msg).to.equal('group message');

		const dm = (await createRoom({ type: 'd', username: 'rocket.cat' })).body.room;
		await sendMessage({ message: { rid: dm._id, msg: 'dm message' } });

		const dmRes = await request.get(api('rooms.history')).set(credentials).query({ roomId: dm._id }).expect(200);

		expect(dmRes.body).to.have.property('success', true);
		expect(dmRes.body.messages[0].msg).to.equal('dm message');

		await Promise.all([deleteRoom({ type: 'p', roomId: group._id }), deleteRoom({ type: 'd', roomId: dm._id })]);
	});

	// Regression: a null `attachments` on the quote attachment used to fail response validation.
	it('should return messages carrying a quote attachment', async () => {
		const parent = await sendMessage({ message: { rid: testChannel._id, msg: 'parent of a discussion' } });

		const discussion = await request
			.post(api('rooms.createDiscussion'))
			.set(credentials)
			.send({
				prid: testChannel._id,
				pmid: parent.body.message._id,
				t_name: `rooms-history-discussion-${Date.now()}`,
			})
			.expect(200);

		const res = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: discussion.body.discussion._id })
			.expect('Content-Type', 'application/json')
			.expect(200);

		expect(res.body).to.have.property('success', true);
		expect(res.body.messages[0].attachments).to.be.an('array');

		await deleteRoom({ type: 'c', roomId: discussion.body.discussion._id });
	});

	it('should build a window around `aroundId` and expose both cursors', async () => {
		const target = messageIds[Math.floor(messageCount / 2)];

		const res = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, aroundId: target, count: 5 })
			.expect('Content-Type', 'application/json')
			.expect(200);

		expect(res.body).to.have.property('success', true);
		expect(res.body.messages).to.have.lengthOf(5);
		expect(res.body.messages.map((m: IMessage) => m._id)).to.include(target);

		// the only request shape that can report more in both directions at once
		expect(res.body.cursor.previous).to.be.a('string');
		expect(res.body.cursor.next).to.be.a('string');

		const timestamps = res.body.messages.map((m: IMessage) => new Date(m.ts).getTime());
		expect(timestamps).to.deep.equal([...timestamps].sort((a, b) => b - a));
	});

	it('should close the cursors at the edges of the room', async () => {
		const newest = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, aroundId: messageIds[messageCount - 1], count: 5 })
			.expect(200);

		expect(newest.body.cursor.next).to.be.null;
		expect(newest.body.cursor.previous).to.be.a('string');

		const oldest = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, aroundId: messageIds[0], count: 5 })
			.expect(200);

		expect(oldest.body.cursor.previous).to.be.null;
		expect(oldest.body.cursor.next).to.be.a('string');
	});

	it('should page in both directions from a window built by `aroundId`', async () => {
		const around = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, aroundId: messageIds[Math.floor(messageCount / 2)], count: 5 })
			.expect(200);

		const windowIds = around.body.messages.map((m: IMessage) => m._id);

		const [older, newer] = await Promise.all([
			request
				.get(api('rooms.history'))
				.set(credentials)
				.query({ roomId: testChannel._id, previous: around.body.cursor.previous, count: 5 })
				.expect(200),
			request
				.get(api('rooms.history'))
				.set(credentials)
				.query({ roomId: testChannel._id, next: around.body.cursor.next, count: 5 })
				.expect(200),
		]);

		const olderIds = older.body.messages.map((m: IMessage) => m._id);
		const newerIds = newer.body.messages.map((m: IMessage) => m._id);

		expect(olderIds.filter((id: string) => windowIds.includes(id))).to.be.empty;
		expect(newerIds.filter((id: string) => windowIds.includes(id))).to.be.empty;
	});

	it('should fail when `aroundId` is combined with a cursor', async () => {
		await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, aroundId: messageIds[0], previous: '1' })
			.expect(400);
	});

	it('should not find a message that belongs to another room', async () => {
		const other = (await createRoom({ type: 'c', name: `rooms-history-other-${Date.now()}` })).body.channel;
		const stray = await sendMessage({ message: { rid: other._id, msg: 'stray message' } });

		await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, aroundId: stray.body.message._id })
			.expect(404);

		await deleteRoom({ type: 'c', roomId: other._id });
	});

	it('should not find a hidden message', async () => {
		// Message_KeepHistory without Message_ShowDeletedStatus hides the deleted message instead of removing it
		await updateSetting('Message_KeepHistory', true);
		try {
			const hidden = await sendMessage({ message: { rid: testChannel._id, msg: 'to be hidden' } });
			await deleteMessage({ roomId: testChannel._id, msgId: hidden.body.message._id });

			await request
				.get(api('rooms.history'))
				.set(credentials)
				.query({ roomId: testChannel._id, aroundId: hidden.body.message._id })
				.expect(404);
		} finally {
			await updateSetting('Message_KeepHistory', false);
		}
	});

	it('should fail when both cursors are provided', async () => {
		const res = await request
			.get(api('rooms.history'))
			.set(credentials)
			.query({ roomId: testChannel._id, next: '1', previous: '1' })
			.expect(400);

		expect(res.body).to.have.property('success', false);
	});

	it('should fail for a room that does not exist', async () => {
		await request.get(api('rooms.history')).set(credentials).query({ roomId: 'does-not-exist' }).expect(404);
	});
});
