import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { sendSimpleMessage } from '../../data/chat.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Discussion privacy]', () => {
	before((_t, done) => getCredentials(done));

	for (const parentType of ['c', 'p'] as const) {
		describe(`with a ${parentType === 'c' ? 'public' : 'private'} parent`, () => {
			let parent: IRoom;
			let discussion: IRoom;
			let parentMessage: IMessage;
			let privateMessage: IMessage;
			let member: TestUser<IUser>;
			let nonMember: TestUser<IUser>;
			let memberCredentials: Credentials;
			let nonMemberCredentials: Credentials;

			before(async () => {
				member = await createUser({ joinDefaultChannels: false });
				nonMember = await createUser({ joinDefaultChannels: false });
				memberCredentials = await login(member.username, password);
				nonMemberCredentials = await login(nonMember.username, password);
				const response = await createRoom({
					type: parentType,
					name: `discussion-privacy-${parentType}-${Date.now()}`,
					members: [member.username, nonMember.username],
				});
				parent = parentType === 'c' ? response.body.channel : response.body.group;
			});

			beforeEach(async () => {
				parentMessage = (await sendSimpleMessage({ roomId: parent._id }).expect(200)).body.message;
				discussion = (
					await request
						.post(api('rooms.createDiscussion'))
						.set(credentials)
						.send({ prid: parent._id, pmid: parentMessage._id, t_name: `private-discussion-${Date.now()}`, users: [member.username] })
						.expect(200)
				).body.discussion;

				if (discussion.t === 'c') {
					await request.post(api('channels.setType')).set(credentials).send({ roomId: discussion._id, type: 'p' }).expect(200);
					discussion.t = 'p';
				}
				privateMessage = (await sendSimpleMessage({ roomId: discussion._id, text: 'Private discussion content' }).expect(200)).body.message;
			});

			afterEach(async () => {
				if (discussion?._id) {
					await deleteRoom({ type: discussion.t as 'c' | 'p', roomId: discussion._id });
				}
			});

			after(async () => {
				if (parent?._id) {
					await deleteRoom({ type: parentType, roomId: parent._id });
				}
				await Promise.all([member, nonMember].filter(Boolean).map((user) => deleteUser(user, { confirmRelinquish: true })));
			});

			it('denies history to a parent-room member outside the discussion', async () => {
				const response = await request.get(api('groups.history')).set(nonMemberCredentials).query({ roomId: discussion._id }).expect(400);
				expect(response.body).to.include({ success: false, errorType: 'error-room-not-found' });
			});

			it('denies reading a known discussion message by its ID', async () => {
				const response = await request
					.get(api('chat.getMessage'))
					.set(nonMemberCredentials)
					.query({ msgId: privateMessage._id })
					.expect(403);
				expect(response.body).to.include({ success: false, errorType: 'error-forbidden' });
			});

			it('denies self-joining through rooms.join', async () => {
				const response = await request.post(api('rooms.join')).set(nonMemberCredentials).send({ roomId: discussion._id }).expect(403);
				expect(response.body).to.include({ success: false, errorType: 'error-forbidden' });
			});

			it('preserves access for an invited discussion member', async () => {
				const response = await request.get(api('groups.history')).set(memberCredentials).query({ roomId: discussion._id }).expect(200);
				expect(response.body.messages.map((message: IMessage) => message._id)).to.include(privateMessage._id);
				await request.get(api('chat.getMessage')).set(memberCredentials).query({ msgId: privateMessage._id }).expect(200);
			});

			it('allows reading and joining after the discussion becomes public again', async () => {
				await request.post(api('groups.setType')).set(credentials).send({ roomId: discussion._id, type: 'c' }).expect(200);
				discussion.t = 'c';
				await request.get(api('chat.getMessage')).set(nonMemberCredentials).query({ msgId: privateMessage._id }).expect(200);
				await request.post(api('rooms.join')).set(nonMemberCredentials).send({ roomId: discussion._id }).expect(200);
			});
		});
	}
});
