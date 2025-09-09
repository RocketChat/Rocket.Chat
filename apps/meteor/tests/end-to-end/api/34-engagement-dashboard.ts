import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';

describe('[Engagement Dashboard]', function () {
	this.retries(0);

	const isEnterprise = Boolean(process.env.IS_EE);

	before((done) => getCredentials(done));

	before(() => updatePermission('view-engagement-dashboard', ['admin']));

	after(() => updatePermission('view-engagement-dashboard', ['admin']));

	(isEnterprise ? describe : describe.skip)('[/engagement-dashboard/channels/list]', () => {
		let testRoom: IRoom;

		before(async () => {
			testRoom = (await createRoom({ type: 'c', name: `channel.test.engagement.${Date.now()}-${Math.random()}` })).body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testRoom._id });
		});

		it('should fail if user does not have the view-engagement-dashboard permission', async () => {
			await updatePermission('view-engagement-dashboard', []);
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					end: new Date().toISOString(),
					start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					offset: 0,
					count: 25,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should fail if start param is not a valid date', async () => {
			await updatePermission('view-engagement-dashboard', ['admin']);
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					start: 'invalid-date',
					end: new Date().toISOString(),
					offset: 0,
					count: 25,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Match error: Failed Match.Where validation in field start');
				});
		});

		it('should fail if end param is not a valid date', async () => {
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					end: 'invalid-date',
					offset: 0,
					count: 25,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Match error: Failed Match.Where validation in field end');
				});
		});

		it('should fail if start param is not provided', async () => {
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					end: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("Match error: Missing key 'start'");
				});
		});

		it('should fail if end param is not provided', async () => {
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("Match error: Missing key 'end'");
				});
		});

		it('should succesfuly return results', async () => {
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					end: new Date().toISOString(),
					start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('channels');
					expect(res.body.channels).to.be.an('array').that.is.not.empty;

					expect(res.body.channels[0]).to.be.an('object').that.is.not.empty;
					expect(res.body.channels[0]).to.have.property('messages').that.is.a('number');
					expect(res.body.channels[0]).to.have.property('lastWeekMessages').that.is.a('number');
					expect(res.body.channels[0]).to.have.property('diffFromLastWeek').that.is.a('number');
					expect(res.body.channels[0].room).to.be.an('object').that.is.not.empty;

					expect(res.body.channels[0].room).to.have.property('_id').that.is.a('string');
					expect(res.body.channels[0].room).to.have.property('name').that.is.a('string');
					expect(res.body.channels[0].room).to.have.property('ts').that.is.a('string');
					expect(res.body.channels[0].room).to.have.property('t').that.is.a('string');
					expect(res.body.channels[0].room).to.have.property('_updatedAt').that.is.a('string');
				});
		});

		it('should fail when the deprecated hideRoomsWithNoActivity param is provided', async () => {
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					end: new Date().toISOString(),
					start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					hideRoomsWithNoActivity: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('Match error');
				});
		});

		// Counting messages in rooms with no activity was deprecated and no longer a desired behavior
		it('should not count messages in an empty room', async () => {
			await request
				.get(api('engagement-dashboard/channels/list'))
				.set(credentials)
				.query({
					end: new Date().toISOString(),
					start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('count', 0);
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('channels');
					expect(res.body.channels).to.be.an('array').that.is.empty;
				});
		});
	});
});
