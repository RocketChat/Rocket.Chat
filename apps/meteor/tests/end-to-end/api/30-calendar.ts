import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user';
import { createUser, login } from '../../data/users.helper';

describe('[Calendar Events]', function () {
	this.retries(0);

	let user2: Awaited<ReturnType<typeof createUser>> | undefined;
	let userCredentials: Awaited<ReturnType<typeof login>> | undefined;

	before((done) => getCredentials(done));

	before(async () => {
		user2 = await createUser();
		userCredentials = await login(user2.username, password);
	});

	describe('[/calendar-events.create]', () => {
		it('should successfully create an event in the calendar', async () => {
			let eventId: string | undefined;

			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					eventId = res.body.id;
				});

			after(async () => {
				await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			});
		});

		it('should fail to create an event without a start time', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to create an event without a subject', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					description: 'Description',
					startTime: new Date().toISOString(),
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to create an event without a description', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					subject: 'Subject',
					startTime: new Date().toISOString(),
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should successfully create an event without reminder information', async () => {
			let eventId: string | undefined;

			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					eventId = res.body.id;
				});

			after(async () => {
				await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			});
		});
	});

	describe('[/calendar-events.list]', () => {
		const testSubject = `calendar-events.list-${Date.now()}`;
		const testSubject2 = `calendar-events.list-${Date.now()}`;
		let eventId: string | undefined;
		let eventId2: string | undefined;
		let eventId3: string | undefined;

		before('create sample events', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: testSubject,
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId = res.body.id;
				});

			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
					subject: testSubject2,
					description: 'Future Event',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId2 = res.body.id;
				});

			await request
				.post(api('calendar-events.create'))
				.set(userCredentials)
				.send({
					startTime: new Date().toISOString(),
					subject: testSubject,
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId3 = res.body.id;
				});
		});

		after(async () => {
			await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			await request.post(api('calendar-events.delete')).set(credentials).send({ eventId: eventId2 });
			await request.post(api('calendar-events.delete')).set(userCredentials).send({ eventId: eventId3 });
		});

		it('should list only the events with the same date', async () => {
			await request
				.get(api('calendar-events.list'))
				.set(credentials)
				.query({
					date: new Date().toISOString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('data').that.is.an('array');

					const events = res.body.data.map((event: any) => event._id);
					expect(events).to.be.an('array').that.includes(eventId);
					expect(events).to.not.includes(eventId2);
				});
		});

		it('should nost list events from other users', async () => {
			await request
				.get(api('calendar-events.list'))
				.set(userCredentials)
				.query({
					date: new Date().toISOString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('data').that.is.an('array');

					const events = res.body.data.map((event: any) => event._id);
					expect(events).to.be.an('array').that.includes(eventId3);
					expect(events).to.not.includes(eventId);
				});
		});
	});

	describe('[/calendar-events.info]', () => {
		const testSubject = `calendar-events.info-${Date.now()}`;
		let eventId: string | undefined;
		let eventId2: string | undefined;

		before('create sample events', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: testSubject,
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId = res.body.id;
				});

			await request
				.post(api('calendar-events.create'))
				.set(userCredentials)
				.send({
					startTime: new Date().toISOString(),
					subject: testSubject,
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId2 = res.body.id;
				});
		});

		after(async () => {
			await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			await request.post(api('calendar-events.delete')).set(userCredentials).send({ eventId: eventId2 });
		});

		it('should return the event information', async () => {
			await request
				.get(api('calendar-events.info'))
				.set(credentials)
				.query({
					id: eventId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('event').that.is.an('object').with.property('subject', testSubject);
				});
		});

		it('should return the event information - regular user', async () => {
			await request
				.get(api('calendar-events.info'))
				.set(userCredentials)
				.query({
					id: eventId2,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('event').that.is.an('object').with.property('subject', testSubject);
				});
		});

		it('should fail when querying an invalid event', async () => {
			await request
				.get(api('calendar-events.info'))
				.set(credentials)
				.query({
					id: 'something-random',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail when querying an event from another user', async () => {
			await request
				.get(api('calendar-events.info'))
				.set(credentials)
				.query({
					id: eventId2,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
	});

	describe('[/calendar-events.import]', () => {
		it('should successfully import an event to the calendar', async () => {
			let eventId: string | undefined;
			const externalId = `calendar-events.import-${Date.now()}`;

			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
					externalId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					eventId = res.body.id;
				});

			after(async () => {
				await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			});
		});

		it('should fail to import an event without an external id', async () => {
			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to import an event without a start time', async () => {
			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to import an event without a subject', async () => {
			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					description: 'Description',
					startTime: new Date().toISOString(),
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to import an event without a description', async () => {
			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					subject: 'Subject',
					startTime: new Date().toISOString(),
					reminderMinutesBeforeStart: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should successfully import an event without reminder information', async () => {
			let eventId: string | undefined;

			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
					externalId: `calendar-events.import-external-id-${Date.now()}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					eventId = res.body.id;
				});

			after(async () => {
				await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			});
		});

		it('should import a new event even if it was already imported by another user', async () => {
			let eventId: string | undefined;
			let eventId2: string | undefined;
			const externalId = `calendar-events.import-${Date.now()}`;

			after(async () => {
				await request.post(api('calendar-events.delete')).set(userCredentials).send({ eventId });
				await request.post(api('calendar-events.delete')).set(credentials).send({ eventId: eventId2 });
			});

			await request
				.post(api('calendar-events.import'))
				.set(userCredentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'First User',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
					externalId,
				})
				.then((res) => {
					eventId = res.body.id;
				});

			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Second User',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
					externalId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.id).to.not.be.equal(eventId);
					eventId2 = res.body.id;
				});

			await request
				.get(api('calendar-events.info'))
				.set(userCredentials)
				.query({ id: eventId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('event').that.is.an('object').with.property('subject', 'First User');
				});

			await request
				.get(api('calendar-events.info'))
				.set(credentials)
				.query({ id: eventId2 })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('event').that.is.an('object').with.property('subject', 'Second User');
				});
		});

		it('should update an event that has the same external id', async () => {
			let eventId: string | undefined;
			const externalId = `calendar-events.import-twice-${Date.now()}`;

			after(async () => {
				await request.post(api('calendar-events.delete')).set(credentials).send({ eventId });
			});

			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
					externalId,
				})
				.then((res) => {
					eventId = res.body.id;
				});

			await request
				.post(api('calendar-events.import'))
				.set(credentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'New Subject',
					description: 'New Description',
					reminderMinutesBeforeStart: 15,
					externalId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect(async (res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('id', eventId);
				});

			await request
				.get(api('calendar-events.info'))
				.set(credentials)
				.query({ id: eventId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('event').that.is.an('object').with.property('subject', 'New Subject');
				});
		});
	});

	describe('[/calendar-events.update]', () => {
		const testSubject = `calendar-events.update-${Date.now()}`;
		let eventId: string | undefined;

		before('create sample events', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(userCredentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Old Subject',
					description: 'Old Description',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId = res.body.id;
				});
		});

		after(async () => {
			await request.post(api('calendar-events.delete')).set(userCredentials).send({ eventId });
		});

		it('should update the event with the new data', async () => {
			await request
				.post(api('calendar-events.update'))
				.set(userCredentials)
				.send({
					eventId,
					startTime: new Date().toISOString(),
					subject: testSubject,
					description: 'New Description',
					reminderMinutesBeforeStart: 15,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect(async (res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('calendar-events.info'))
				.set(userCredentials)
				.query({ id: eventId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('event').that.is.an('object');
					expect(res.body.event).to.have.property('subject', testSubject);
					expect(res.body.event).to.have.property('description', 'New Description');
				});
		});

		it('should fail to update an event that doesnt exist', async () => {
			await request
				.post(api('calendar-events.update'))
				.set(userCredentials)
				.send({
					eventId: 'something-random',
					startTime: new Date().toISOString(),
					subject: testSubject,
					description: 'New Description',
					reminderMinutesBeforeStart: 15,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to update an event from another user', async () => {
			await request
				.post(api('calendar-events.update'))
				.set(credentials)
				.send({
					eventId,
					startTime: new Date().toISOString(),
					subject: 'Another Subject',
					description: 'Third Description',
					reminderMinutesBeforeStart: 20,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
	});

	describe('[/calendar-events.delete]', () => {
		let eventId: string | undefined;

		before('create sample events', async () => {
			await request
				.post(api('calendar-events.create'))
				.set(userCredentials)
				.send({
					startTime: new Date().toISOString(),
					subject: 'Subject',
					description: 'Description',
					reminderMinutesBeforeStart: 10,
				})
				.then((res) => {
					eventId = res.body.id;
				});
		});

		it('should fail to delete an event from another user', async () => {
			await request
				.post(api('calendar-events.delete'))
				.set(credentials)
				.send({
					eventId,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should delete the specified event', async () => {
			await request
				.post(api('calendar-events.delete'))
				.set(userCredentials)
				.send({
					eventId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect(async (res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('calendar-events.info'))
				.set(userCredentials)
				.query({ id: eventId })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail to delete an event that doesnt exist', async () => {
			await request
				.post(api('calendar-events.delete'))
				.set(userCredentials)
				.send({
					eventId: 'something-random',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
	});
});
