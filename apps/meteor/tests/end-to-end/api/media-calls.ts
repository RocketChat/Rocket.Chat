import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { withDatabase } from '../../data/database.helper';
import { retry } from '../../data/retry';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Media Calls]', () => {
	let user2: IUser;
	let userCredentials: Credentials;

	before((_t, done) => getCredentials(done));

	before(async () => {
		user2 = await createUser();
		userCredentials = await login(user2.username, password);
	});

	after(() => deleteUser(user2));

	describe('[/media-calls.info]', () => {
		it('should return valid internal call information', async () => {
			await request
				.get(api('media-calls.info'))
				.set(credentials)
				.query({
					callId: 'rocketchat.internal.call.test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('call').that.is.an('object');

					const { call } = res.body;
					expect(call).to.have.property('_id', 'rocketchat.internal.call.test');
					expect(call).to.have.property('service', 'webrtc');
					expect(call).to.have.property('kind', 'direct');
					expect(call).to.have.property('state', 'hangup');
					expect(call).to.have.property('ended', true);
					expect(call).to.have.property('hangupReason', 'normal');
					expect(call).to.have.property('createdBy').that.is.an('object');
					expect(call.createdBy).to.have.property('type', 'user');
					expect(call).to.have.property('caller').that.is.an('object');
					expect(call.caller).to.have.property('type', 'user');
					expect(call).to.have.property('callee').that.is.an('object');
					expect(call.callee).to.have.property('type', 'user');
					expect(call).to.have.property('endedBy').that.is.an('object');
					expect(call.endedBy).to.have.property('type', 'user');
					expect(call).to.have.property('uids').that.is.an('array');
					expect(call.uids).to.have.lengthOf(2);
				});
		});

		it('should return valid external call information', async () => {
			await request
				.get(api('media-calls.info'))
				.set(credentials)
				.query({
					callId: 'rocketchat.external.call.test.outbound',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('call').that.is.an('object');

					const { call } = res.body;
					expect(call).to.have.property('_id', 'rocketchat.external.call.test.outbound');
					expect(call).to.have.property('service', 'webrtc');
					expect(call).to.have.property('kind', 'direct');
					expect(call).to.have.property('state', 'hangup');
					expect(call).to.have.property('ended', true);
					expect(call).to.have.property('hangupReason', 'normal');
					expect(call).to.have.property('createdBy').that.is.an('object');
					expect(call).to.have.property('sipCallId', 'sipCallId3');
					expect(call.createdBy).to.have.property('type', 'user');
					expect(call).to.have.property('caller').that.is.an('object');
					expect(call.caller).to.have.property('type', 'user');
					expect(call).to.have.property('callee').that.is.an('object');
					expect(call.callee).to.have.property('type', 'sip');
					expect(call).to.have.property('endedBy').that.is.an('object');
					expect(call.endedBy).to.have.property('type', 'user');
					expect(call).to.have.property('uids').that.is.an('array');
					expect(call.uids).to.have.lengthOf(1);
				});
		});

		it('should not return invalid calls', async () => {
			await request
				.get(api('media-calls.info'))
				.set(credentials)
				.query({
					callId: 'invalid.call',
				})
				.expect('Content-Type', 'application/json')
				.expect(404);
		});

		it('should not return calls from other users', async () => {
			await request
				.get(api('media-calls.info'))
				.set(userCredentials)
				.query({
					callId: 'rocketchat.internal.call.test',
				})
				.expect('Content-Type', 'application/json')
				.expect(404);
		});
	});

	describe('with a ringing call and an ended call', () => {
		const run = Date.now();
		const liveCallId = `media-calls-live-${run}`;
		const endedCallId = `media-calls-ended-${run}`;

		const mediaCall = (_id: string, ended: boolean): IMediaCall =>
			({
				_id,
				service: 'webrtc',
				kind: 'direct',
				state: ended ? 'hangup' : 'ringing',
				createdBy: { type: 'user', id: credentials['X-User-Id'] },
				createdAt: new Date(),
				_updatedAt: new Date(),
				caller: { type: 'user', id: credentials['X-User-Id'], contractId: 'caller-contract' },
				callee: { type: 'user', id: user2._id },
				ended,
				expiresAt: new Date(Date.now() + 60 * 60 * 1000),
				uids: [credentials['X-User-Id'], user2._id],
				features: ['audio'],
			}) as unknown as IMediaCall;

		let dmId: string;

		before(async () => {
			dmId = (await createRoom({ type: 'd', username: user2.username as string })).body.room._id;
			await withDatabase((db) =>
				db.collection<IMediaCall>('rocketchat_media_calls').insertMany([mediaCall(liveCallId, false), mediaCall(endedCallId, true)]),
			);
		});

		after(async () => {
			await withDatabase((db) =>
				Promise.all([
					db.collection<IMediaCall>('rocketchat_media_calls').deleteMany({ _id: { $in: [liveCallId, endedCallId] } }),
					db.collection('rocketchat_call_history').deleteMany({ callId: liveCallId }),
				]),
			);
			await deleteRoom({ type: 'd', roomId: dmId });
		});

		describe('[/media-calls.state]', () => {
			it("should list the user's calls that are not over", async () => {
				const res = await request.get(api('media-calls.state')).set(userCredentials).expect(200);
				const callIds = res.body.calls.map(({ _id }: IMediaCall) => _id);

				expect(callIds).to.include(liveCallId);
				expect(callIds).to.not.include(endedCallId);
			});
		});

		describe('[/media-calls.stateSignals]', () => {
			it("should resend the signals of the user's calls that are not over", async () => {
				const res = await request
					.get(api('media-calls.stateSignals'))
					.set(userCredentials)
					.query({ contractId: 'callee-contract' })
					.expect(200);
				const callIds = res.body.signals.map(({ callId }: { callId: string }) => callId);

				expect(callIds).to.include(liveCallId);
				expect(callIds).to.not.include(endedCallId);
			});
		});

		describe('[/media-calls.answer]', () => {
			it('should not let a user who is not the callee answer the call', async () => {
				const res = await request
					.post(api('media-calls.answer'))
					.set(credentials)
					.send({ callId: liveCallId, contractId: 'caller-contract', answer: 'accept' })
					.expect(400);

				expect(res.body).to.have.property('error', 'not-found');

				const call = await withDatabase((db) => db.collection<IMediaCall>('rocketchat_media_calls').findOne({ _id: liveCallId }));
				expect(call).to.include({ state: 'ringing', ended: false });
			});

			it('should end the call and record it in both users history when the callee rejects it', async () => {
				const res = await request
					.post(api('media-calls.answer'))
					.set(userCredentials)
					.send({ callId: liveCallId, contractId: 'callee-contract', answer: 'reject' })
					.expect(200);

				expect(res.body.call).to.include({ ended: true });
				expect(res.body.call.endedBy).to.include({ type: 'user', id: user2._id });

				await retry(
					'history saved with its message',
					async () => {
						const history = await withDatabase((db) =>
							db
								.collection('rocketchat_call_history')
								.find({ callId: liveCallId, messageId: { $exists: true } })
								.toArray(),
						);
						expect(history.map(({ uid }) => uid)).to.have.members([credentials['X-User-Id'], user2._id]);
					},
					{ retries: 20, delayMs: 100 },
				);
			});
		});
	});
});
