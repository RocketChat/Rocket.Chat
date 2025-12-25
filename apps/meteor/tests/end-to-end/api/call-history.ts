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

					expect(res.body.items).to.have.lengthOf(6);
					expect(res.body).to.have.property('total', 6);
					expect(res.body).to.have.property('count', 6);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
					expect(historyIds).to.include('rocketchat.external.history.test.outbound');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound.2');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound.2');

					const internalItem1 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.outbound');
					expect(internalItem1).to.have.property('callId', 'rocketchat.internal.call.test');
					expect(internalItem1).to.have.property('state', 'ended');
					expect(internalItem1).to.have.property('type', 'media-call');
					expect(internalItem1).to.have.property('duration', 10);
					expect(internalItem1).to.have.property('external', false);
					expect(internalItem1).to.have.property('direction', 'outbound');
					expect(internalItem1).to.have.property('contactId');
					expect(internalItem1).to.have.property('contactName', 'Pineapple');
					expect(internalItem1).to.have.property('contactUsername', 'fruit-001');

					const internalItem2 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.inbound');
					expect(internalItem2).to.have.property('callId', 'rocketchat.internal.call.test.2');
					expect(internalItem2).to.have.property('state', 'not-answered');
					expect(internalItem2).to.have.property('type', 'media-call');
					expect(internalItem2).to.have.property('duration', 10);
					expect(internalItem2).to.have.property('external', false);
					expect(internalItem2).to.have.property('direction', 'inbound');
					expect(internalItem2).to.have.property('contactId');
					expect(internalItem2).to.have.property('contactName', 'Apple');
					expect(internalItem2).to.have.property('contactUsername', 'fruit-002');

					const internalItem3 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.outbound.2');
					expect(internalItem3).to.have.property('callId', 'rocketchat.extra.call.test.1');
					expect(internalItem3).to.have.property('state', 'transferred');
					expect(internalItem3).to.have.property('direction', 'outbound');
					expect(internalItem3).to.have.property('contactName', 'Grapefruit 002');

					const internalItem4 = res.body.items.find((item: any) => item._id === 'rocketchat.internal.history.test.inbound.2');
					expect(internalItem4).to.have.property('callId', 'rocketchat.extra.call.test.2');
					expect(internalItem4).to.have.property('state', 'transferred');
					expect(internalItem4).to.have.property('direction', 'inbound');
					expect(internalItem4).to.have.property('contactName', 'Pasta 1');

					const externalItem1 = res.body.items.find((item: any) => item._id === 'rocketchat.external.history.test.outbound');
					expect(externalItem1).to.have.property('callId', 'rocketchat.external.call.test.outbound');
					expect(externalItem1).to.have.property('state', 'failed');
					expect(externalItem1).to.have.property('type', 'media-call');
					expect(externalItem1).to.have.property('duration', 10);
					expect(externalItem1).to.have.property('external', true);
					expect(externalItem1).to.have.property('direction', 'outbound');
					expect(externalItem1).to.have.property('contactExtension', '1001');

					const externalItem2 = res.body.items.find((item: any) => item._id === 'rocketchat.external.history.test.inbound');
					expect(externalItem2).to.have.property('callId', 'rocketchat.external.call.test.inbound');
					expect(externalItem2).to.have.property('state', 'ended');
					expect(externalItem2).to.have.property('type', 'media-call');
					expect(externalItem2).to.have.property('duration', 10);
					expect(externalItem2).to.have.property('external', true);
					expect(externalItem2).to.have.property('direction', 'inbound');
					expect(externalItem2).to.have.property('contactExtension', '1002');
				});
		});

		it('should not list history entries from other users', async () => {
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

		it('should apply filter by state', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					state: ['ended'],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(2);
					expect(res.body).to.have.property('total', 2);
					expect(res.body).to.have.property('count', 2);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
				});
		});

		it('should apply filter by multiple states', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					state: ['failed', 'ended'],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(3);
					expect(res.body).to.have.property('total', 3);
					expect(res.body).to.have.property('count', 3);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.external.history.test.outbound');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
				});
		});

		it('should apply filter by direction', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					direction: 'inbound',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(3);
					expect(res.body).to.have.property('total', 3);
					expect(res.body).to.have.property('count', 3);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound.2');
				});
		});

		it('should apply filter by state and direction', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					state: ['failed', 'ended'],
					direction: 'inbound',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(1);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('count', 1);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
				});
		});

		it('should return item that match full contact name', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: 'Pineapple',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(1);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('count', 1);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
				});
		});

		it('should return items that match partial contact name', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: 'Apple',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(2);
					expect(res.body).to.have.property('total', 2);
					expect(res.body).to.have.property('count', 2);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
				});
		});

		it('should return item that match full contact username', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: 'fruit-001',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(1);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('count', 1);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
				});
		});

		it('should return items that match partial contact username', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: 'fruit-',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(2);
					expect(res.body).to.have.property('total', 2);
					expect(res.body).to.have.property('count', 2);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
				});
		});

		it('should return items that match partial contact name or username', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: 'fruit',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(3);
					expect(res.body).to.have.property('total', 3);
					expect(res.body).to.have.property('count', 3);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound.2');
				});
		});

		it('should return item that match full contact extension', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: '1001',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(1);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('count', 1);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.external.history.test.outbound');
				});
		});

		it('should return items that match partial contact extension', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: '100',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(2);
					expect(res.body).to.have.property('total', 2);
					expect(res.body).to.have.property('count', 2);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.external.history.test.outbound');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
				});
		});

		it('should return items that match partial contact name, username or extension', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: '002',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(3);
					expect(res.body).to.have.property('total', 3);
					expect(res.body).to.have.property('count', 3);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound.2');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
				});
		});

		it('should apply filter with falsy value', async () => {
			await request
				.get(api('call-history.list'))
				.set(credentials)
				.query({
					filter: '0',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').that.is.an('array');

					expect(res.body.items).to.have.lengthOf(5);
					expect(res.body).to.have.property('total', 5);
					expect(res.body).to.have.property('count', 5);

					const historyIds = res.body.items.map((item: any) => item._id);
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.inbound');
					expect(historyIds).to.include('rocketchat.internal.history.test.outbound.2');
					expect(historyIds).to.include('rocketchat.external.history.test.outbound');
					expect(historyIds).to.include('rocketchat.external.history.test.inbound');
				});
		});
	});

	describe('[/call-history.info]', () => {
		it('should return the history entry information', async () => {
			await request
				.get(api('call-history.info'))
				.set(credentials)
				.query({
					historyId: 'rocketchat.internal.history.test.outbound',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('item').that.is.an('object');
					expect(res.body).to.have.property('call').that.is.an('object');

					const { item, call } = res.body;
					expect(item).to.have.property('_id', 'rocketchat.internal.history.test.outbound');
					expect(item).to.have.property('callId', 'rocketchat.internal.call.test');
					expect(item).to.have.property('state', 'ended');
					expect(item).to.have.property('type', 'media-call');
					expect(item).to.have.property('duration', 10);
					expect(item).to.have.property('external', false);
					expect(item).to.have.property('direction', 'outbound');
					expect(item).to.have.property('contactId');
					expect(item).to.have.property('contactName', 'Pineapple');
					expect(item).to.have.property('contactUsername', 'fruit-001');
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
					expect(item).to.have.property('_id', 'rocketchat.internal.history.test.inbound');
					expect(item).to.have.property('callId', 'rocketchat.internal.call.test.2');
					expect(item).to.have.property('state', 'not-answered');
					expect(item).to.have.property('type', 'media-call');
					expect(item).to.have.property('duration', 10);
					expect(item).to.have.property('external', false);
					expect(item).to.have.property('direction', 'inbound');
					expect(item).to.have.property('contactId');
					expect(item).to.have.property('contactName', 'Apple');
					expect(item).to.have.property('contactUsername', 'fruit-002');
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
					historyId: 'rocketchat.internal.history.test.outbound',
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
