import { expect } from 'chai';

import {
	getCredentials,
	api,
	request,
	credentials,
} from '../../data/api-data.js';
import { password } from '../../data/user';
import { createUser, login, deleteUser } from '../../data/users.helper';

const GENERAL_CHANNEL = 'GENERAL';

/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} username
 * @property {string} name
 */

/**
 * @typedef {Object} OutOfOfficeData
 * @property {boolean} isEnabled
 * @property {string} customMessage
 * @property {string[]} roomIds
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @param {OutOfOfficeData} outOfOfficeData
 * @returns {OutOfOfficeData}
 */
const generateOutOfOfficeData = (outOfOfficeData = {}) => {
	const isEnabled =		typeof outOfOfficeData.isEnabled === 'boolean'
		? outOfOfficeData.isEnabled
		: true;
	const roomIds = outOfOfficeData.roomIds
		? outOfOfficeData.roomIds
		: [GENERAL_CHANNEL];
	const customMessage =		typeof outOfOfficeData.customMessage === 'string'
		? outOfOfficeData.customMessage
		: 'Hello, I am currently out of office!';
	const startDate = outOfOfficeData.startDate
		? outOfOfficeData.startDate
		: new Date().toISOString();

	let { endDate } = outOfOfficeData;
	if (!outOfOfficeData.endDate) {
		const endDateObject = new Date();
		endDateObject.setHours(endDateObject.getHours() + 1);
		endDate = endDateObject.toISOString();
	}

	return {
		startDate,
		endDate,
		isEnabled,
		roomIds,
		customMessage,
	};
};

describe('[OutOfOffice]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	// only for debugging
	// TODO - but there needs to a permenant method
	after((done) => {
		request.get(api('outOfOffice.removeAll')).expect(200).end(done);
	});

	describe('[/outOfOffice.toggle]', () => {
		it('cannot be enabled if the user is unauthenticated', (done) => {
			request
				.post(api('outOfOffice.toggle'))
				.send(generateOutOfOfficeData())
				.expect(401)
				.end(done);
		});

		it('cannot be enabled if the "customMessage" is empty', (done) => {
			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(generateOutOfOfficeData({ customMessage: '' }))
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		// TODO - I DO NOT THINK THIS IS REQUIRED
		it('cannot be enabled if "isEnabled" field is missing', (done) => {
			const outOfOfficeData = generateOutOfOfficeData();
			delete outOfOfficeData.isEnabled;
			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(outOfOfficeData)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('cannot be enabled if "startDate" and "endDate" are invalid ', (done) => {
			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(
					generateOutOfOfficeData({
						startDate: 'invalid-start-date',
						endDate: 'invalid-end-date',
					}),
				)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('cannot be enabled if "startDate" is after the "endDate"', (done) => {
			const startDateObject = new Date();
			const endDateObject = new Date();
			endDateObject.setHours(endDateObject.getHours() - 1);

			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(
					generateOutOfOfficeData({
						startDate: startDateObject.toISOString(),
						endDate: endDateObject.toISOString(),
					}),
				)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		// TODO - check for this validation
		it.skip('cannot be enabled if "startDate" is before the current date', (done) => {
			const outOfOfficeData = generateOutOfOfficeData();
			const startDateObject = new Date();
			startDateObject.setDate(startDateObject.getHours() - 1);

			outOfOfficeData.startDate = startDateObject.toISOString();

			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(outOfOfficeData)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('has a message when successfully enabled', (done) => {
			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(generateOutOfOfficeData())
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('has a message when successfully disabled', (done) => {
			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(generateOutOfOfficeData({ isEnabled: false }))
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});
	});

	describe('[postMessageHandler]', () => {
		/** @type {User} */
		let createdUser;
		let createdUserCredentials;
		const firstCustomMessage =			'_Out of Office Message_ Currently testing *PostMessageHandler*.';

		before(async () => {
			createdUser = await createUser();
			createdUserCredentials = await login(createdUser.username, password);
		});

		before(function(done) {
			this.timeout(7000);
			request
				.post(api('outOfOffice.toggle'))
				.set(credentials)
				.send(generateOutOfOfficeData({ customMessage: firstCustomMessage }))
				.expect(200)
				.end(() => setTimeout(done, 5000)); // wait for OutOfOfficeRooms collection to be populated
		});

		after(async () => {
			await deleteUser(createdUser);
		});

		describe("user's out-of-office message is sent for the first incoming message", () => {
			before('send 1st message to the general channel', (done) => {
				request
					.post(api('chat.sendMessage'))
					.set(createdUserCredentials)
					.send({
						message: {
							rid: GENERAL_CHANNEL,
							msg: 'Sending the first incoming message.',
						},
					})
					.expect(200)
					.end(() => setTimeout(done, 1000));
			});

			it("the user's out-of-office message is present", (done) => {
				request
					.get(api('channels.history'))
					.query({ roomId: GENERAL_CHANNEL })
					.query({ count: 1 })
					.set(createdUserCredentials)
					.expect(200)
					.expect((res) => {
						expect(res.body.messages[0].msg).to.eq(firstCustomMessage);
					})
					.end(done);
			});
		});
		describe("the user's out-of-office message is not sent for the second incoming message", () => {
			const secondMessage = 'Sending the second incoming message';

			before('send 2nd message to the general channel', (done) => {
				request
					.post(api('chat.sendMessage'))
					.set(createdUserCredentials)
					.send({
						message: {
							rid: GENERAL_CHANNEL,
							msg: secondMessage,
						},
					})
					.expect(200)
					.end(() => setTimeout(done, 1000));
			});

			it('the last message is retained', (done) => {
				request
					.get(api('channels.history'))
					.query({ roomId: GENERAL_CHANNEL })
					.query({ count: 1 })
					.set(createdUserCredentials)
					.expect(200)
					.expect((res) => {
						expect(res.body.messages[0].msg).to.eq(secondMessage);
					})
					.end(done);
			});
		});

		describe('Out-Of-Office message is not sent if it was disabled before the first incoming message', () => {
			const secondCustomMessage =				'_Out Of Office_ Was disabled before first message';
			const firstIncomingMessage = 'Testing if out-office message was present';

			before('enable out-of-office', function(done) {
				this.timeout(7000);
				request
					.post(api('outOfOffice.toggle'))
					.set(credentials)
					.send(generateOutOfOfficeData({ customMessage: secondCustomMessage }))
					.expect(200)
					.end(() => setTimeout(done, 5000)); // wait for OutOfOfficeRooms collection to be populated
			});

			before('disable out-of-office', (done) => {
				request
					.post(api('outOfOffice.toggle'))
					.set(credentials)
					.send(generateOutOfOfficeData({ isEnabled: false }))
					.expect(200)
					.end(done);
			});

			before('send message to general channel', (done) => {
				request
					.post(api('chat.sendMessage'))
					.set(createdUserCredentials)
					.send({
						message: {
							rid: GENERAL_CHANNEL,
							msg: firstIncomingMessage,
						},
					})
					.expect(200)
					.end(() => setTimeout(done, 1000));
			});

			it('the out-of-office message was not sent', (done) => {
				request
					.get(api('channels.history'))
					.query({ roomId: GENERAL_CHANNEL })
					.query({ count: 1 })
					.set(createdUserCredentials)
					.expect(200)
					.expect((res) => {
						expect(res.body.messages[0].msg).to.eq(firstIncomingMessage);
					})
					.end(done);
			});
		});
	});

	describe('[/outOfOffice.status]', () => {
		/** @type {User} */
		let createdUser;
		let createdUserCredentials;
		const createdOutOfOfficeData = generateOutOfOfficeData({
			customMessage:
				'_Out of Office Message_ Testing *status endpoint* currently',
		});

		before(async () => {
			createdUser = await createUser();
			createdUserCredentials = await login(createdUser.username, password);
		});

		before(function(done) {
			request
				.post(api('outOfOffice.toggle'))
				.set(createdUserCredentials)
				.send(createdOutOfOfficeData)
				.expect(200)
				.end(done);
		});

		after(async () => {
			await deleteUser(createdUser);
		});

		it('returns unauthorized if user is not authenticated', (done) => {
			request.get(api('outOfOffice.status')).expect(401).end(done);
		});

		it("has the same data when user's out-of-office was enabled", (done) => {
			request
				.get(api('outOfOffice.status'))
				.set(createdUserCredentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body.success).to.be.true;
					expect(res.body).to.include.keys(
						'isEnabled',
						'customMessage',
						'roomIds',
						'startDate',
						'endDate',
					);

					expect(res.body.isEnabled).to.be.true;
					expect(res.body.customMessage).to.eq(
						createdOutOfOfficeData.customMessage,
					);
					expect(res.body.roomIds).to.deep.eq(createdOutOfOfficeData.roomIds);
					expect(res.body.startDate).to.eq(createdOutOfOfficeData.startDate);
					expect(res.body.endDate).to.eq(createdOutOfOfficeData.endDate);
				})
				.end(done);
		});

		describe('out-of-office data for the user is updated', () => {
			const newOutOfOfficeData = generateOutOfOfficeData({
				customMessage: 'an updated custom message',
			});

			before((done) => {
				request
					.post(api('outOfOffice.toggle'))
					.set(createdUserCredentials)
					.send(newOutOfOfficeData)
					.expect(200)
					.end(done);
			});

			it('has the updated out-of-office data', (done) => {
				request
					.get(api('outOfOffice.status'))
					.set(createdUserCredentials)
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body.success).to.be.true;
						expect(res.body.isEnabled).to.be.true;
						expect(res.body.customMessage).to.eq(
							newOutOfOfficeData.customMessage,
						);
						expect(res.body.roomIds).to.deep.eq(newOutOfOfficeData.roomIds);
						expect(res.body.startDate).to.eq(newOutOfOfficeData.startDate);
						expect(res.body.endDate).to.eq(newOutOfOfficeData.endDate);
					})
					.end(done);
			});
		});
	});
});
