import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IRoom, ISetting, IUpload, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response, Test } from 'supertest';

import { api, credentials, getCredentials, methodCall, request } from '../../data/api-data';
import { uploadFileToRC } from '../../data/file.helper';
import { imgURL } from '../../data/interactions';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { addUserToRoom, createRoom, deleteRoom, getSubscriptionByRoomId } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const SETTING = 'Restricted_Message_History_Enabled';

type Endpoint = Parameters<typeof api>[0];

type Listing = {
	path: string;
	fetch: (userCredentials: Credentials) => Promise<Response>;
	ids: (body: any) => string[];
	hidden: () => string[];
	visible: () => string[];
};

(IS_EE ? describe : describe.skip)('[Restricted message history] (Enterprise Only)', () => {
	let previousSetting: ISetting['value'];

	let room: IRoom;
	let newcomer: IUser;
	let newcomerCredentials: Credentials;
	let bystander: IUser;
	let bystanderCredentials: Credentials;

	const token = `restricted${Date.now()}`;

	let oldMessage: IMessage;
	let oldMention: IMessage;
	let oldThread: IMessage;
	let oldUpload: IMessage;
	let oldDiscussion: IRoom;
	let oldDiscussionMessage: IMessage;
	let newMessage: IMessage;
	let newMention: IMessage;
	let replyToOldThread: IMessage;
	let channelReplyToOldThread: IMessage;
	let newThread: IMessage;
	let newUpload: IMessage;
	let newDiscussion: IRoom;

	const sendTo = async (rid: IRoom['_id'], text: string, userCredentials = credentials, extra: Partial<IMessage> = {}) => {
		const res = await request
			.post(api('chat.sendMessage'))
			.set(userCredentials)
			.send({ message: { rid, msg: text, ...extra } })
			.expect(200);
		return res.body.message as IMessage;
	};

	const send = (text: string, userCredentials = credentials, extra: Partial<IMessage> = {}) =>
		sendTo(room._id, text, userCredentials, extra);

	const pin = (messageId: IMessage['_id']) => request.post(api('chat.pinMessage')).set(credentials).send({ messageId }).expect(200);

	const upload = async (description: string) => (await uploadFileToRC(room._id, imgURL, description, { request, credentials })).message;

	const fileId = (message: IMessage) => (message.file?._id ?? message.files?.[0]?._id) as IUpload['_id'];

	const createDiscussion = async (name: string) => {
		const res = await request
			.post(api('rooms.createDiscussion'))
			.set(credentials)
			.send({ prid: room._id, t_name: `${name}-${Date.now()}` })
			.expect(200);
		return res.body.discussion as IRoom;
	};

	const getMessage = (msgId: IMessage['_id'], userCredentials: Credentials) =>
		request.get(api('chat.getMessage')).set(userCredentials).query({ msgId });

	const historyIds = async (userCredentials: Credentials, roomId = room._id) => {
		const res = await request.get(api('rooms.history')).set(userCredentials).query({ roomId, count: 100 }).expect(200);
		return (res.body.messages as IMessage[]).map(({ _id }) => _id);
	};

	const setMemberHistoryAccess = (userId: IUser['_id'], restricted: boolean, userCredentials = credentials) =>
		request.post(api('rooms.setMemberHistoryAccess')).set(userCredentials).send({ roomId: room._id, userId, restricted });

	const messageIds = (messages: Pick<IMessage, '_id'>[]) => messages.map(({ _id }) => _id);

	before((_t, done) => getCredentials(done));

	before(async () => {
		previousSetting = await getSettingValueById(SETTING);
		await updateSetting(SETTING, true);

		newcomer = await createUser();
		newcomerCredentials = await login(newcomer.username, password);
		bystander = await createUser();
		bystanderCredentials = await login(bystander.username, password);

		room = (await createRoom({ type: 'c', name: `restricted-history-${Date.now()}`, members: [bystander.username!] })).body.channel;
		await request.post(api('rooms.saveRoomSettings')).set(credentials).send({ rid: room._id, hideHistoryForNewMembers: true }).expect(200);

		oldMessage = await send('sent before the newcomer joined');
		await pin(oldMessage._id);
		oldMention = await send(`@${newcomer.username} @${bystander.username} ${token} before`);
		oldThread = await send('thread started before the newcomer joined');
		await send('reply sent before the newcomer joined', credentials, { tmid: oldThread._id });
		oldUpload = await upload('uploaded before the newcomer joined');
		oldDiscussion = await createDiscussion('before');
		oldDiscussionMessage = await sendTo(oldDiscussion._id, 'discussed before the newcomer joined');

		await sleep(50);
		await addUserToRoom({ usernames: [newcomer.username!], rid: room._id });
		await sleep(50);

		newMessage = await send('sent after the newcomer joined');
		await pin(newMessage._id);
		newMention = await send(`@${newcomer.username} @${bystander.username} ${token} after`);
		replyToOldThread = await send('reply to an old thread', credentials, { tmid: oldThread._id });
		channelReplyToOldThread = await send('reply to an old thread, also sent to the channel', credentials, {
			tmid: oldThread._id,
			tshow: true,
		});
		newThread = await send('thread started after the newcomer joined');
		await send('reply to a new thread', credentials, { tmid: newThread._id });
		newUpload = await upload('uploaded after the newcomer joined');
		newDiscussion = await createDiscussion('after');
	});

	after(async () => {
		await Promise.all([deleteRoom({ type: 'c', roomId: oldDiscussion._id }), deleteRoom({ type: 'c', roomId: newDiscussion._id })]);
		await deleteRoom({ type: 'c', roomId: room._id });
		await Promise.all([deleteUser(newcomer), deleteUser(bystander)]);
		await updateSetting(SETTING, previousSetting);
	});

	describe('joining a room that hides its history', () => {
		it('records the join time on the newcomer only', async () => {
			const newcomerSubscription = await getSubscriptionByRoomId(room._id, newcomerCredentials);
			expect(newcomerSubscription).to.have.property('historyVisibleFrom');

			const bystanderSubscription = await getSubscriptionByRoomId(room._id, bystanderCredentials);
			expect(bystanderSubscription).to.not.have.property('historyVisibleFrom');
		});

		it('records the join time when someone joins by themselves', async () => {
			const joiner = await createUser();
			const joinerCredentials = await login(joiner.username, password);

			try {
				await request.post(api('channels.join')).set(joinerCredentials).send({ roomId: room._id }).expect(200);

				const subscription = await getSubscriptionByRoomId(room._id, joinerCredentials);
				expect(subscription).to.have.property('historyVisibleFrom');
				expect(await historyIds(joinerCredentials)).to.not.include(oldMessage._id);
			} finally {
				await deleteUser(joiner);
			}
		});
	});

	describe('every path that lists messages leaves out what the newcomer cannot see', () => {
		const roomHistory = {
			hidden: () => [oldMessage._id, oldThread._id],
			visible: () => [newMessage._id, newThread._id, channelReplyToOldThread._id],
		};
		const threads = { hidden: () => [oldThread._id], visible: () => [newThread._id] };
		const mentions = { hidden: () => [oldMention._id], visible: () => [newMention._id] };
		const pinned = { hidden: () => [oldMessage._id], visible: () => [newMessage._id] };
		const files = { hidden: () => [fileId(oldUpload)], visible: () => [fileId(newUpload)] };
		const discussions = { hidden: () => [oldDiscussion._id], visible: () => [newDiscussion._id] };

		const get = (path: Endpoint, query: () => Record<string, unknown>) => (userCredentials: Credentials) =>
			request.get(api(path)).set(userCredentials).query(query()).expect(200);

		const listings: Listing[] = [
			{
				path: 'rooms.history',
				fetch: get('rooms.history', () => ({ roomId: room._id, count: 100 })),
				ids: (body) => messageIds(body.messages),
				...roomHistory,
			},
			{
				path: 'channels.history',
				fetch: get('channels.history', () => ({ roomId: room._id, count: 100 })),
				ids: (body) => messageIds(body.messages),
				...roomHistory,
			},
			{
				path: 'channels.messages',
				fetch: get('channels.messages', () => ({ roomId: room._id, count: 100 })),
				ids: (body) => messageIds(body.messages),
				...roomHistory,
			},
			{
				path: 'chat.syncMessages',
				fetch: get('chat.syncMessages', () => ({ roomId: room._id, lastUpdate: new Date(0).toISOString() })),
				ids: (body) => messageIds(body.result.updated),
				...roomHistory,
			},
			{
				path: 'chat.getMessages',
				fetch: (userCredentials) =>
					request
						.post(api('chat.getMessages'))
						.set(userCredentials)
						.send({ messageIds: [...roomHistory.hidden(), ...roomHistory.visible()] })
						.expect(200),
				ids: (body) => messageIds(body.messages),
				...roomHistory,
			},
			{
				path: 'chat.getThreadsList',
				fetch: get('chat.getThreadsList', () => ({ rid: room._id })),
				ids: (body) => messageIds(body.threads),
				...threads,
			},
			{
				path: 'chat.syncThreadsList',
				fetch: get('chat.syncThreadsList', () => ({ rid: room._id, updatedSince: new Date(0).toISOString() })),
				ids: (body) => messageIds(body.threads.update),
				...threads,
			},
			{
				path: 'chat.getPinnedMessages',
				fetch: get('chat.getPinnedMessages', () => ({ roomId: room._id })),
				ids: (body) => messageIds(body.messages),
				...pinned,
			},
			{
				path: 'chat.getMentionedMessages',
				fetch: get('chat.getMentionedMessages', () => ({ roomId: room._id })),
				ids: (body) => messageIds(body.messages),
				...mentions,
			},
			{
				path: 'channels.getAllUserMentionsByChannel',
				fetch: get('channels.getAllUserMentionsByChannel', () => ({ roomId: room._id })),
				ids: (body) => messageIds(body.mentions),
				...mentions,
			},
			{
				path: 'chat.search',
				fetch: get('chat.search', () => ({ roomId: room._id, searchText: token })),
				ids: (body) => messageIds(body.messages),
				...mentions,
			},
			{
				path: 'rocketchatSearch.search across rooms',
				fetch: (userCredentials) =>
					request
						.post(methodCall('rocketchatSearch.search'))
						.set(userCredentials)
						.send({
							message: JSON.stringify({
								msg: 'method',
								id: 'id',
								method: 'rocketchatSearch.search',
								params: [token, { rid: room._id }, { searchAll: true }],
							}),
						})
						.expect(200),
				ids: (body) => messageIds(JSON.parse(body.message).result.message.docs),
				...mentions,
			},
			{
				path: 'chat.getDiscussions',
				fetch: get('chat.getDiscussions', () => ({ roomId: room._id })),
				ids: (body) => (body.messages as IMessage[]).map(({ drid }) => drid!),
				...discussions,
			},
			{
				path: 'rooms.getDiscussions',
				fetch: get('rooms.getDiscussions', () => ({ roomId: room._id })),
				ids: (body) => messageIds(body.discussions),
				...discussions,
			},
			{
				path: 'channels.files',
				fetch: get('channels.files', () => ({ roomId: room._id })),
				ids: (body) => messageIds(body.files),
				...files,
			},
			{ path: 'rooms.images', fetch: get('rooms.images', () => ({ roomId: room._id })), ids: (body) => messageIds(body.files), ...files },
		];

		listings.forEach((listing) => {
			it(listing.path, async () => {
				const [newcomerRes, bystanderRes] = await Promise.all([listing.fetch(newcomerCredentials), listing.fetch(bystanderCredentials)]);
				const newcomerIds = listing.ids(newcomerRes.body);
				const bystanderIds = listing.ids(bystanderRes.body);

				expect(bystanderIds).to.include.members(listing.hidden());
				expect(newcomerIds).to.include.members(listing.visible());
				for (const id of [...listing.hidden(), replyToOldThread._id]) {
					expect(newcomerIds).to.not.include(id);
				}
			});
		});

		it('a discussion the newcomer reads through the room, without joining it', async () => {
			expect(await historyIds(bystanderCredentials, oldDiscussion._id)).to.include(oldDiscussionMessage._id);
			expect(await historyIds(newcomerCredentials, oldDiscussion._id)).to.not.include(oldDiscussionMessage._id);
		});
	});

	describe('every path that fetches a message by id refuses a hidden one', () => {
		const fetches: { path: string; fetch: (userCredentials: Credentials) => Test; refusedWith: number }[] = [
			{ path: 'chat.getMessage', fetch: (c) => getMessage(oldMessage._id, c), refusedWith: 400 },
			{ path: 'push.get', fetch: (c) => request.get(api('push.get')).set(c).query({ id: oldMessage._id }), refusedWith: 400 },
			{
				path: 'chat.getThreadMessages',
				fetch: (c) => request.get(api('chat.getThreadMessages')).set(c).query({ tmid: oldThread._id }),
				refusedWith: 403,
			},
			{
				path: 'chat.syncThreadMessages',
				fetch: (c) =>
					request
						.get(api('chat.syncThreadMessages'))
						.set(c)
						.query({ tmid: oldThread._id, updatedSince: new Date(0).toISOString() }),
				refusedWith: 403,
			},
			{
				path: 'rooms.history around a message',
				fetch: (c) => request.get(api('rooms.history')).set(c).query({ roomId: room._id, aroundId: oldMessage._id }),
				refusedWith: 404,
			},
			{
				path: 'chat.getMessageReadReceipts',
				fetch: (c) => request.get(api('chat.getMessageReadReceipts')).set(c).query({ messageId: oldMessage._id }),
				refusedWith: 400,
			},
		];

		fetches.forEach(({ path, fetch, refusedWith }) => {
			it(path, async () => {
				await fetch(bystanderCredentials).expect(200);
				await fetch(newcomerCredentials).expect(refusedWith);
			});
		});
	});

	describe('every action on a hidden message is refused', () => {
		it('chat.react', async () => {
			const res = await request.post(api('chat.react')).set(newcomerCredentials).send({ messageId: oldMessage._id, emoji: ':smile:' });
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});

		it('chat.followMessage', async () => {
			const res = await request.post(api('chat.followMessage')).set(newcomerCredentials).send({ mid: oldThread._id });
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
		});

		it('chat.pinMessage', async () => {
			const res = await request.post(api('chat.pinMessage')).set(newcomerCredentials).send({ messageId: oldMessage._id });
			expect(res.body).to.have.property('errorType', 'error-invalid-message');
		});

		it('chat.reportMessage', async () => {
			const res = await request
				.post(api('chat.reportMessage'))
				.set(newcomerCredentials)
				.send({ messageId: oldMessage._id, description: 'reporting blind' })
				.expect(400);
			expect(res.body).to.have.property('error').that.includes('error-invalid-message_id');
		});

		it('chat.starMessage', async () => {
			await request.post(api('chat.starMessage')).set(newcomerCredentials).send({ messageId: oldMessage._id });

			const res = await getMessage(oldMessage._id, credentials).expect(200);
			expect((res.body.message.starred ?? []).map(({ _id }: { _id: string }) => _id)).to.not.include(newcomer._id);
		});

		it('rooms.createDiscussion from a hidden message', async () => {
			const res = await request
				.post(api('rooms.createDiscussion'))
				.set(newcomerCredentials)
				.send({ prid: room._id, pmid: oldMessage._id, t_name: `from-a-hidden-message-${Date.now()}` });
			expect(res.body).to.have.property('errorType', 'error-invalid-message');
		});

		it('autotranslate.translateMessage', async () => {
			const previous = await getSettingValueById('AutoTranslate_Enabled');
			await updateSetting('AutoTranslate_Enabled', true);
			try {
				const res = await request
					.post(api('autotranslate.translateMessage'))
					.set(newcomerCredentials)
					.send({ messageId: oldMessage._id, targetLanguage: 'en' })
					.expect(400);
				expect(res.body).to.have.property('error', 'Message not found.');
			} finally {
				await updateSetting('AutoTranslate_Enabled', previous);
			}
		});

		it('quoting a hidden message by its link', async () => {
			const siteUrl = String(await getSettingValueById('Site_Url')).replace(/\/$/, '');
			const link = `${siteUrl}/channel/${room.name}?msg=${oldMessage._id}`;
			const quotes = (message: IMessage) =>
				(message.attachments ?? []).filter((attachment) => 'message_link' in attachment && attachment.message_link === link);

			expect(quotes(await send(`quoting ${link}`, bystanderCredentials))).to.have.lengthOf(1);
			expect(quotes(await send(`quoting ${link}`, newcomerCredentials))).to.have.lengthOf(0);
		});
	});

	describe('a thread started before the newcomer joined', () => {
		const expectNotFollowing = async () => {
			const res = await getMessage(oldThread._id, credentials).expect(200);
			expect(res.body.message.replies).to.not.include(newcomer._id);
		};

		it('refuses replies through chat.sendMessage', async () => {
			const res = await request
				.post(api('chat.sendMessage'))
				.set(newcomerCredentials)
				.send({ message: { rid: room._id, msg: 'replying blind', tmid: oldThread._id } });
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
			await expectNotFollowing();
		});

		it('refuses replies through chat.postMessage', async () => {
			const res = await request
				.post(api('chat.postMessage'))
				.set(newcomerCredentials)
				.send({ roomId: room._id, text: 'replying blind', tmid: oldThread._id });
			expect(res.body).to.have.property('errorType', 'error-not-allowed');
			await expectNotFollowing();
		});

		it('does not make the newcomer follow it or notify them when mentioned in it', async () => {
			await send(`@${newcomer.username} have a look`, credentials, { tmid: oldThread._id });
			await send(`@${newcomer.username} have a look here too`, credentials, { tmid: oldThread._id, tshow: true });

			await expectNotFollowing();

			const subscription = await getSubscriptionByRoomId(room._id, newcomerCredentials);
			expect(subscription.tunread ?? []).to.not.include(oldThread._id);
			expect(subscription.tunreadUser ?? []).to.not.include(oldThread._id);
		});
	});

	describe('in a private group', () => {
		let group: IRoom;
		let oldGroupMessage: IMessage;
		let newGroupMessage: IMessage;

		before(async () => {
			group = (await createRoom({ type: 'p', name: `restricted-history-group-${Date.now()}` })).body.group;
			await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({ rid: group._id, hideHistoryForNewMembers: true })
				.expect(200);
			oldGroupMessage = await sendTo(group._id, 'sent to the group before the newcomer was invited');

			await sleep(50);
			await request.post(api('groups.invite')).set(credentials).send({ roomId: group._id, userId: newcomer._id }).expect(200);
			await sleep(50);

			newGroupMessage = await sendTo(group._id, 'sent to the group after the newcomer was invited');
		});

		after(() => deleteRoom({ type: 'p', roomId: group._id }));

		it('records the invite time', async () => {
			const subscription = await getSubscriptionByRoomId(group._id, newcomerCredentials);
			expect(subscription).to.have.property('historyVisibleFrom');
		});

		(['groups.history', 'groups.messages'] as const).forEach((path) => {
			it(path, async () => {
				const fetch = (userCredentials: Credentials) =>
					request.get(api(path)).set(userCredentials).query({ roomId: group._id, count: 100 }).expect(200);
				const [newcomerRes, ownerRes] = await Promise.all([fetch(newcomerCredentials), fetch(credentials)]);

				expect(messageIds(ownerRes.body.messages)).to.include(oldGroupMessage._id);
				expect(messageIds(newcomerRes.body.messages)).to.include(newGroupMessage._id);
				expect(messageIds(newcomerRes.body.messages)).to.not.include(oldGroupMessage._id);
			});
		});
	});

	describe('rooms.setMemberHistoryAccess', () => {
		it('rejects members who cannot add people to the room', async () => {
			await setMemberHistoryAccess(newcomer._id, false, bystanderCredentials).expect(403);
		});

		it('restores the full history and announces it', async () => {
			await setMemberHistoryAccess(newcomer._id, false).expect(200);

			await getMessage(oldMessage._id, newcomerCredentials).expect(200);

			const res = await request.get(api('rooms.history')).set(credentials).query({ roomId: room._id, count: 5 }).expect(200);
			expect((res.body.messages as IMessage[]).some(({ t }) => t === 'user-history-restored')).to.be.true;
		});

		it('hides the history again from the join time, including what the member starred meanwhile', async () => {
			await request.post(api('chat.starMessage')).set(newcomerCredentials).send({ messageId: oldMessage._id }).expect(200);
			await setMemberHistoryAccess(newcomer._id, true).expect(200);

			const subscription = await getSubscriptionByRoomId(room._id, newcomerCredentials);
			expect(new Date(subscription.historyVisibleFrom!).getTime()).to.equal(new Date(subscription.ts).getTime());
			expect(await historyIds(newcomerCredentials)).to.not.include(oldMessage._id);

			const starred = await request.get(api('chat.getStarredMessages')).set(newcomerCredentials).query({ roomId: room._id }).expect(200);
			expect(messageIds(starred.body.messages)).to.not.include(oldMessage._id);
		});
	});

	describe('when the workspace setting is off', () => {
		before(async () => {
			await updateSetting(SETTING, false);
		});

		after(async () => {
			await updateSetting(SETTING, true);
		});

		it('stops hiding anything but keeps the restriction', async () => {
			expect(await historyIds(newcomerCredentials)).to.include(oldMessage._id);

			const subscription = await getSubscriptionByRoomId(room._id, newcomerCredentials);
			expect(subscription).to.have.property('historyVisibleFrom');
		});

		it('refuses to change the room setting', async () => {
			await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({ rid: room._id, hideHistoryForNewMembers: false })
				.expect(400);
		});
	});
});
