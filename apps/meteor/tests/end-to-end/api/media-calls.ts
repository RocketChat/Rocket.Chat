import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Media Calls]', () => {
	let user2: IUser;
	let userCredentials: Credentials;

	before((done) => getCredentials(done));

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
});
