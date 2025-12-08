import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Call History]', () => {
	let user2: IUser;
	let userCredentials: Credentials;

	before((done) => getCredentials(done));

	before(async () => {
		user2 = await createUser();
		userCredentials = await login(user2.username, password);
	});

	after(() => deleteUser(user2));

	describe('[/call-history.list]', () => {
		it('should list all history entries for that uid', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(4);
					expect(res.body).to.have.property('total', 4);
					expect(res.body).to.have.property('count', 4);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test');
					expect(historyIds).to.include('rocketchat.internal.history.test.2');
					expect(historyIds).to.include('rocketchat.internal.history.test.3');
					expect(historyIds).to.include('rocketchat.internal.history.test.4');

					const internalItem1 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test');
					expect(internalItem1).to.have.property('callId', 'rocketchat.internal.call.test');
					expect(internalItem1).to.have.property('state', 'ended');
					expect(internalItem1).to.have.property('type', 'media-call');
					expect(internalItem1).to.have.property('duration', 10);
					expect(internalItem1).to.have.property('external', false);
					expect(internalItem1).to.have.property('direction', 'outbound');
					expect(internalItem1).to.have.property('contactId');

					const internalItem2 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.2');
					expect(internalItem2).to.have.property('callId', 'rocketchat.internal.call.test.2');
					expect(internalItem2).to.have.property('state', 'ended');
					expect(internalItem2).to.have.property('type', 'media-call');
					expect(internalItem2).to.have.property('duration', 10);
					expect(internalItem2).to.have.property('external', false);
					expect(internalItem2).to.have.property('direction', 'inbound');
					expect(internalItem2).to.have.property('contactId');

					const externalItem1 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.3');
					expect(externalItem1).to.have.property('callId', 'rocketchat.internal.call.test.3');
					expect(externalItem1).to.have.property('state', 'ended');
					expect(externalItem1).to.have.property('type', 'media-call');
					expect(externalItem1).to.have.property('duration', 10);
					expect(externalItem1).to.have.property('external', true);
					expect(externalItem1).to.have.property('direction', 'outbound');
					expect(externalItem1).to.have.property('contactExtension', '1001');

					const externalItem2 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.4');
					expect(externalItem2).to.have.property('callId', 'rocketchat.internal.call.test.4');
					expect(externalItem2).to.have.property('state', 'ended');
					expect(externalItem2).to.have.property('type', 'media-call');
					expect(externalItem2).to.have.property('duration', 10);
					expect(externalItem2).to.have.property('external', true);
					expect(externalItem2).to.have.property('direction', 'inbound');
					expect(externalItem2).to.have.property('contactExtension', '1001');
				});
		});

		it('should nost list history entries from other users', async () => {
			await request
				.get(api('call-history.list'))
				.set(userCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(0);
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('count', 0);
				});
		});
	});

	describe('[/call-history.info]', () => {
		it('should return the history entry information', async () => {
			await request
				.get(api('call-history.info'))
				.set(credentials)
				.query({
					historyId: 'rocketchat.internal.history.test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('item').that.is.an('object');
					expect(res.body).to.have.property('call').that.is.an('object');

					const { item, call } = res.body;
					expect(item).to.have.property('_id', 'rocketchat.internal.history.test');
					expect(item).to.have.property('callId', 'rocketchat.internal.call.test');
					expect(item).to.have.property('state', 'ended');
					expect(item).to.have.property('type', 'media-call');
					expect(item).to.have.property('duration', 10);
					expect(item).to.have.property('external', false);
					expect(item).to.have.property('direction', 'outbound');
					expect(item).to.have.property('contactId');
					expect(item).to.have.property('ts');
					expect(item).to.have.property('endedAt');

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

		it('should return the history entry information when searching by call id', async () => {
			await request
				.get(api('call-history.info'))
				.set(credentials)
				.query({
					callId: 'rocketchat.internal.call.test.2',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('item').that.is.an('object');
					expect(res.body).to.have.property('call').that.is.an('object');

					const { item, call } = res.body;
					expect(item).to.have.property('_id', 'rocketchat.internal.history.test.2');
					expect(item).to.have.property('callId', 'rocketchat.internal.call.test.2');
					expect(item).to.have.property('state', 'ended');
					expect(item).to.have.property('type', 'media-call');
					expect(item).to.have.property('duration', 10);
					expect(item).to.have.property('external', false);
					expect(item).to.have.property('direction', 'inbound');
					expect(item).to.have.property('contactId');
					expect(item).to.have.property('ts');
					expect(item).to.have.property('endedAt');

					expect(call).to.have.property('_id', 'rocketchat.internal.call.test.2');
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

		it('should fail when querying an invalid entry', async () => {
			await request
				.get(api('call-history.info'))
				.set(credentials)
				.query({
					historyId: 'something-random',
				})
				.expect('Content-Type', 'application/json')
				.expect(404);
		});

		it('should fail when querying an invalid entry by call id', async () => {
			await request
				.get(api('call-history.info'))
				.set(credentials)
				.query({
					callId: 'something-random',
				})
				.expect('Content-Type', 'application/json')
				.expect(404);
		});

		it('should fail when querying an entry from another user', async () => {
			await request
				.get(api('call-history.info'))
				.set(userCredentials)
				.query({
					historyId: 'rocketchat.internal.history.test',
				})
				.expect('Content-Type', 'application/json')
				.expect(404);
		});

		it('should fail when querying an entry from another user by call id', async () => {
			await request
				.get(api('call-history.info'))
				.set(userCredentials)
				.query({
					callId: 'rocketchat.internal.call.test.2',
				})
				.expect('Content-Type', 'application/json')
				.expect(404);
		});
	});
});
