import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IRoom, ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { sendSimpleMessage } from '../../data/chat.helper';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { addUserToRoom, createRoom, deleteRoom, getSubscriptionByRoomId } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const SETTING = 'Restricted_Message_History_Enabled';

(IS_EE ? describe : describe.skip)('[Restricted message history] (Enterprise Only)', () => {
	let previousSetting: ISetting['value'];

	let room: IRoom;
	let newcomer: IUser;
	let newcomerCredentials: Credentials;
	let bystander: IUser;
	let bystanderCredentials: Credentials;

	let oldMessage: IMessage;
	let oldThread: IMessage;
	let newMessage: IMessage;
	let replyToOldThread: IMessage;
	let channelReplyToOldThread: IMessage;
	let newThread: IMessage;

	const send = async (text: string, userCredentials = credentials, extra: Partial<IMessage> = {}) => {
		const res = await request
			.post(api('chat.sendMessage'))
			.set(userCredentials)
			.send({ message: { rid: room._id, msg: text, ...extra } })
			.expect(200);
		return res.body.message as IMessage;
	};

	const historyIds = async (userCredentials: Credentials) => {
		const res = await request.get(api('rooms.history')).set(userCredentials).query({ roomId: room._id, count: 100 }).expect(200);
		return (res.body.messages as IMessage[]).map(({ _id }) => _id);
	};

	const getMessage = (msgId: IMessage['_id'], userCredentials: Credentials) =>
		request.get(api('chat.getMessage')).set(userCredentials).query({ msgId });

	const setMemberHistoryAccess = (userId: IUser['_id'], restricted: boolean, userCredentials = credentials) =>
		request.post(api('rooms.setMemberHistoryAccess')).set(userCredentials).send({ roomId: room._id, userId, restricted });

	before((_t, done) => getCredentials(done));

	before(async () => {
		previousSetting = await getSettingValueById(SETTING);
		await updateSetting(SETTING, true);

		newcomer = await createUser();
		newcomerCredentials = await login(newcomer.username, password);
		bystander = await createUser();
		bystanderCredentials = await login(bystander.username, password);

		room = (await createRoom({ type: 'c', name: `restricted-history-${Date.now()}`, members: [bystander.username!] })).body.channel;

		oldMessage = await send('sent before the newcomer joined');
		oldThread = await send('thread started before the newcomer joined');
		await send('reply sent before the newcomer joined', credentials, { tmid: oldThread._id });

		await request.post(api('rooms.saveRoomSettings')).set(credentials).send({ rid: room._id, hideHistoryForNewMembers: true }).expect(200);

		await sleep(50);
		await addUserToRoom({ usernames: [newcomer.username!], rid: room._id });
		await sleep(50);

		newMessage = await send('sent after the newcomer joined');
		replyToOldThread = await send('reply to an old thread', credentials, { tmid: oldThread._id });
		channelReplyToOldThread = await send('reply to an old thread, also sent to the channel', credentials, {
			tmid: oldThread._id,
			tshow: true,
		});
		newThread = await send('thread started after the newcomer joined');
		await sendSimpleMessage({ roomId: room._id, text: 'reply to a new thread', tmid: newThread._id });
	});

	after(async () => {
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

		it('hides earlier messages and old threads from the timeline', async () => {
			const ids = await historyIds(newcomerCredentials);

			expect(ids).to.include(newMessage._id);
			expect(ids).to.include(newThread._id);
			expect(ids).to.include(channelReplyToOldThread._id);
			expect(ids).to.not.include(oldMessage._id);
			expect(ids).to.not.include(oldThread._id);
			expect(ids).to.not.include(replyToOldThread._id);
		});

		it('keeps the full timeline for members who were already in the room', async () => {
			const ids = await historyIds(bystanderCredentials);

			expect(ids).to.include(oldMessage._id);
			expect(ids).to.include(oldThread._id);
		});

		it('refuses to fetch a hidden message by id', async () => {
			const res = await getMessage(oldMessage._id, newcomerCredentials);
			expect(res.status).to.not.equal(200);
		});

		it('refuses to open a thread started before the cutoff', async () => {
			const res = await request.get(api('chat.getThreadMessages')).set(newcomerCredentials).query({ tmid: oldThread._id });
			expect(res.status).to.equal(400);
		});

		it('lists only the threads started after the cutoff', async () => {
			const res = await request.get(api('chat.getThreadsList')).set(newcomerCredentials).query({ rid: room._id }).expect(200);
			const ids = (res.body.threads as IMessage[]).map(({ _id }) => _id);

			expect(ids).to.include(newThread._id);
			expect(ids).to.not.include(oldThread._id);
		});

		it('refuses to follow, react to or star a hidden message', async () => {
			const follow = await request.post(api('chat.followMessage')).set(newcomerCredentials).send({ mid: oldThread._id });
			expect(follow.status).to.equal(400);

			const react = await request.post(api('chat.react')).set(newcomerCredentials).send({ messageId: oldMessage._id, emoji: ':smile:' });
			expect(react.status).to.equal(400);
		});

		it('leaves hidden messages out of search results', async () => {
			const res = await request
				.get(api('chat.search'))
				.set(newcomerCredentials)
				.query({ roomId: room._id, searchText: 'before the newcomer joined' })
				.expect(200);

			expect(res.body.messages).to.have.lengthOf(0);
		});

		it('does not make the newcomer follow a hidden thread when mentioned in it', async () => {
			await send(`@${newcomer.username} have a look`, credentials, { tmid: oldThread._id });

			const res = await getMessage(oldThread._id, credentials).expect(200);
			expect(res.body.message.replies).to.not.include(newcomer._id);
		});
	});

	describe('rooms.setMemberHistoryAccess', () => {
		it('rejects members who cannot add people to the room', async () => {
			const res = await setMemberHistoryAccess(newcomer._id, false, bystanderCredentials);
			expect(res.status).to.equal(400);
		});

		it('restores the full history and announces it', async () => {
			await setMemberHistoryAccess(newcomer._id, false).expect(200);

			await getMessage(oldMessage._id, newcomerCredentials).expect(200);

			const res = await request.get(api('rooms.history')).set(credentials).query({ roomId: room._id, count: 5 }).expect(200);
			expect((res.body.messages as IMessage[]).some(({ t }) => t === 'user-history-restored')).to.be.true;
		});

		it('hides the history again from the join time', async () => {
			await setMemberHistoryAccess(newcomer._id, true).expect(200);

			const subscription = await getSubscriptionByRoomId(room._id, newcomerCredentials);
			expect(new Date(subscription.historyVisibleFrom!).getTime()).to.equal(new Date(subscription.ts).getTime());
			expect(await historyIds(newcomerCredentials)).to.not.include(oldMessage._id);
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
			const res = await request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({ rid: room._id, hideHistoryForNewMembers: false });
			expect(res.status).to.equal(400);
		});
	});
});
